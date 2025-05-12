/** /System/Files/Database/TransactionQueue
 * 
 * @author Alex Malotky
 */
import {openDB, IDBPDatabase, IDBPTransaction, IDBPObjectStore} from "idb";
import FileDatabaseSchema, {FileDirectoryData, FolderDirectoryData, FileData} from "./Schema";
import {DEFAULT_ROOT_MODE, formatMode} from "../Mode";
import { ROOT_USER_ID } from "../../User";
import {join} from "../Path";
import { encodeValue } from "../Encoding";
import { sleep } from "@";
import { InitIterator } from "../../Initalize";
import { UserId } from "../../User";

// Current Database Version
const DatabaseVersion = 3;
const Stores = ["File", "Directory"] as const;

//Database Transaction
export type FilestoreTransaction<M extends IDBTransactionMode> = IDBPTransaction<FileDatabaseSchema, typeof Stores, M>;
type DirectoryInitStore = IDBPObjectStore<FileDatabaseSchema, typeof Stores, "Directory", "versionchange">
type FileInitStore      = IDBPObjectStore<FileDatabaseSchema, typeof Stores, "File", "versionchange">

//Init Data For Directory Structure
export interface FilestoreInitData {
    [name:string]:[number, string|FileData|FilestoreInitData]
}

//Database Connection
let db:IDBPDatabase<FileDatabaseSchema>|null|undefined;

/** Build Directory
 * 
 * @param {string} path 
 * @param {InitData} init 
 */
async function _build(path:string, init:FilestoreInitData, user:UserId, dir:DirectoryInitStore, file:FileInitStore) {
    for(const name in init){
        const filePath = join(path, name);
        let info = await dir.get(filePath);
        let [mode, data] = init[name];
        mode = isNaN(mode)? DEFAULT_ROOT_MODE: formatMode(mode);

        //Build File
        if(data instanceof Uint8Array || typeof data === "string") {
            
            //Create
            if(info  === undefined) {
                const [base, ext = ""] = name.split(".");
                info = {
                    type: "File",
                    owner: user,
                    mode: mode,
                    base: base,
                    ext: ext,
                    links: 0,
                    listeners: 0,
                    created: new Date(),
                    updated: new Date(),
                    path: path
                } satisfies FileDirectoryData;

                //Save
                await dir.put(info, filePath);
                await file.put(encodeValue(data), filePath);
            }

        //Build Directory
        } else {

            //Create
            if(info === undefined){
                await dir.add({
                    type: "Directory",
                    owner: user,
                    mode: mode,
                    links: 0,
                    created: new Date(),
                    base: name,
                    path: path
                } satisfies FolderDirectoryData, filePath)
            }

            //Populate Directory
            await _build(filePath, data, user, dir, file);
        }
    }
}

/** Init Filestore Database
 * 
 * @param {FilestoreInitData} data 
 */
export async function initFilestoreDatabase() {
    try {
        db = await openDB("Terminal:FileStore", DatabaseVersion, {
            upgrade: async(db)=>{
                const dir:DirectoryInitStore = db.createObjectStore("Directory");
                const file:FileInitStore = db.createObjectStore("File");
    
                await dir.put({
                    type: "Directory",
                    owner: ROOT_USER_ID,
                    mode: DEFAULT_ROOT_MODE,
                    links: 0,
                    created: new Date(),
                    base: "",
                    path: "/"
                } satisfies FolderDirectoryData, "/");
    
                

                for(const [user, data] of InitIterator()){
                    await _build("/", data, user, dir, file);
                }
                
            }
        });
    } catch (e){
        console.error(e);
        db = null;
    }
}

//Queue Reference
interface QueueRef<M extends IDBTransactionMode>{
    readonly index:number
    tx?:FilestoreTransaction<M>
    stack:string[]
    open:()=>Promise<FilestoreTransaction<M>>
    close:()=>void;
}

//Close Queue Reference When Garbage Collected!
const AutoCloseQueue = new FinalizationRegistry<QueueRef<any>>(async(value)=>{
    if(value.tx){
        console.error("Dangling Connection Closed!", value);
        value.tx = undefined;
        value.close()
    }
    
});

//Database Transaction Queue
const queue:QueueRef<any>[] = [];
let count:number = 0;

/** Access Transaction Queue
 * 
 * @param {string} mode 
 * @returns {QueueRef}
 */
export default function TransactionQueue<M extends IDBTransactionMode = "readonly">(mode:M = "readonly" as M):QueueRef<M> {
    const index = ++count;
    const trace = new Error();
    return {
        index,
        stack: trace.stack? trace.stack.split("\n"): [],
        /** Wait for Opening the Transaction
         * 
         * @returns {Promise<FilestoreTransaction>}
         */
        async open():Promise<FilestoreTransaction<M>>{
            if(mode.includes("write")) {
                queue.push(this);
                let index = queue.indexOf(this);
                while(index > 0) {
                    await sleep(10);

                    index = queue.indexOf(this);
                }
                if(index < 0)
                    console.warn("Reference removed from queue before ready!", index)
            }

            while(db === undefined)
                await sleep();

            if(db === null)
                throw new Error("Connection is closed!");

            this.tx = db.transaction(Stores, mode);
            AutoCloseQueue.register(new WeakRef(this), this, this.tx);
            return this.tx;
        },

        /** Close Transaction
         * 
         * Allows the queue to continue.
         */
        close():void{
            const i = queue.indexOf(this);
            if(i >= 0)
                queue.splice(i, 1);
            if(this.tx){
                AutoCloseQueue.unregister(this.tx);
                this.tx = undefined;
            }
        }
    };
}