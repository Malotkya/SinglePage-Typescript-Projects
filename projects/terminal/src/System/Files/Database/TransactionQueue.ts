/** /System/Files/Database/TransactionQueue
 * 
 * @author Alex Malotky
 */
import {openDB, IDBPDatabase, IDBPTransaction} from "idb";
import FileDatabaseSchema, {FileDirectoryData, FolderDirectoryData} from "./Schema";
import {DEFAULT_ROOT_MODE, formatMode} from "../Mode";
import { ROOT_USER_ID } from "../../User";
import {join} from "../Path";
import { sleep } from "@";

// Current Database Version
const DatabaseVersion = 3;
const Stores = ["File", "Directory"] as const;

//Database Transaction
export type FilestoreTransaction<M extends IDBTransactionMode> = IDBPTransaction<FileDatabaseSchema, typeof Stores, M>;

//Init Data For Directory Structure
export interface FilestoreInitData {
    [name:string]:[number, string|FilestoreInitData]
}

//Database Connection
let db:IDBPDatabase<FileDatabaseSchema>|null|undefined;

/** Build Directory
 * 
 * @param {string} path 
 * @param {InitData} init 
 */
async function _build(path:string, init:FilestoreInitData, tx:FilestoreTransaction<"readwrite">) {
    const dir  = tx.objectStore("Directory");
    const file = tx.objectStore("File");
    for(const name in init){
        const filePath = join(path, name);
        let info = await dir.get(filePath);
        let [mode, data] = init[name];
        mode = isNaN(mode)? DEFAULT_ROOT_MODE: formatMode(mode);

        //Build File
        if(typeof data === "string") {
            
            //Create
            if(info  === undefined) {
                const [base, ext = ""] = name.split(".");
                info = {
                    type: "File",
                    owner: ROOT_USER_ID,
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
                await file.put(data, filePath);
            }

        //Build Directory
        } else {

            //Create
            if(info === undefined){
                await dir.add({
                    type: "Directory",
                    owner: ROOT_USER_ID,
                    mode: mode,
                    links: 0,
                    created: new Date(),
                    base: name,
                    path: path
                } satisfies FolderDirectoryData, filePath)
            }

            //Populate Directory
            await _build(filePath, data, tx);
        }
    }
}

/** Init Filestore Database
 * 
 * @param {FilestoreInitData} data 
 */
export async function initFilestoreDatabase(data:FilestoreInitData) {
    db = await openDB("Terminal:FileStore", DatabaseVersion, {
        upgrade: async(db)=>{
            const dir = db.createObjectStore("Directory");
            db.createObjectStore("File");

            await dir.put({
                type: "Directory",
                owner: ROOT_USER_ID,
                mode: DEFAULT_ROOT_MODE,
                links: 0,
                created: new Date(),
                base: "",
                path: "/"
            } satisfies FolderDirectoryData, "/");

            await _build("/", data, db.transaction(Stores, "readwrite"));
        }
    })
}

//Queue Reference
interface QueueRef<M extends IDBTransactionMode>{
    readonly index:number
    tx?:FilestoreTransaction<M>
    open:()=>Promise<FilestoreTransaction<M>>
    close:()=>Promise<void>;
}

//Close Queue Reference When Garbage Collected!
const AutoCloseQueue = new FinalizationRegistry<QueueRef<any>>((value)=>{
    console.debug("Dangling Connection Closed!", value.index);
    value.close()
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
    //console.trace(index);
    return {
        index,

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
        async close():Promise<void>{
            AutoCloseQueue.unregister(this.tx!);
            const i = queue.indexOf(this);
            if(i >= 0)
                queue.splice(i, 1);
            if(this.tx){
                await this.tx.done
                this.tx = undefined;
            }
        }
    };
}