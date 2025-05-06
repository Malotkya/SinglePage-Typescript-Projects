/** /System/Database
 * 
 * @author Alex Malotky
 */
import {openDB, IDBPDatabase, IDBPTransaction} from "idb";
import { sleep } from ".";

///////////////////// Database Structure Information ////////////////////

const DatabaseVersion = 2;

const Stores = {
    FileSystem: ["File", "Directory"]
} as const;

export type StoreType = keyof typeof Stores;
export type DatabaseTransaction<M extends IDBTransactionMode, S extends StoreType> = IDBPTransaction<any, typeof Stores[S], M>
let count = 0;

///////////////////// Database Connection ////////////////////
let db:IDBPDatabase<any>|undefined|null;
openDB("Terminal", DatabaseVersion, {
    upgrade: async(db)=>{
        for(const i in Stores) {
            for(const name of Stores[i as StoreType]) {
                db.createObjectStore(name);
            }
        }
    }
}).then((value)=>{
    db = value;
}).catch(e=>{
    console.error(e);
    db = null;
});

/////////////////////////// Queue Information ////////////////////////////////////////

export interface QueueRef<M extends IDBTransactionMode, S extends StoreType>{
    readonly index:number
    tx?:DatabaseTransaction<M, S>
    open:()=>Promise<DatabaseTransaction<M, S>>
    close:()=>void;
}

const AutoCloseQueue = new FinalizationRegistry<QueueRef<any, any>>((value)=>{
    console.debug("Dangling Connection Closed!", value.index);
    value.close()
});
const queue:QueueRef<any, any>[] = [];

export default function Database<M extends IDBTransactionMode, S extends StoreType>(store:S, mode:M):QueueRef<M, S> {
    const index = ++count;
    //console.trace(index);
    return {
        index,
        async open(){
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

            this.tx = db.transaction(Stores[store], mode);
            AutoCloseQueue.register(new WeakRef(this), this, this.tx);
            return this.tx;
        },
        close() {
            AutoCloseQueue.unregister(this.tx!);
            const i = queue.indexOf(this);
            if(i >= 0)
                queue.splice(i, 1);
            this.tx = undefined;
        }
    };
}
