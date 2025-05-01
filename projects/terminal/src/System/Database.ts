/** /System/Database
 * 
 * @author Alex Malotky
 */
import {openDB, IDBPDatabase, IDBPTransaction} from "idb";
import { sleep } from ".";

///////////////////// Database Structure Information ////////////////////

const DatabaseVersion = 2;

const Stores = {
    FileSystem: ["File", "Directory"],
    User: ["User"]
} as const;

const Indexes:Record<string, string[]> = {
    "User": ["username"]
}

export type StoreType = keyof typeof Stores;
export type DatabaseTransaction<M extends IDBTransactionMode, S extends StoreType> = IDBPTransaction<any, typeof Stores[S], M>


///////////////////// Database Connection ////////////////////
let db:IDBPDatabase<any>|undefined|null;
openDB("Terminal", DatabaseVersion, {
    upgrade: async(db)=>{
        for(const i in Stores) {
            for(const name of Stores[i as StoreType]) {
                const s = db.createObjectStore(name);

                if(Indexes[name]) {
                    for(const index of Indexes[name]) {
                        s.createIndex(index, index, {unique: true});
                    }
                }
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

interface QueueRef<M extends IDBTransactionMode, S extends StoreType>{
    open:()=>Promise<DatabaseTransaction<M, S>>
    close:()=>void;
}

const AutoCloseQueue = new FinalizationRegistry<QueueRef<any, any>>((value)=>value.close());
const QueueMap:Record<StoreType, QueueRef<any, any>[]> = {
    "FileSystem": [],
    "User": []
}

export default function Database<M extends IDBTransactionMode, S extends StoreType>(store:S, mode:M):QueueRef<M, S> {
    const ref:QueueRef<M, S> = {
        async open(){
            if(mode.includes("write")) {
                const queue = QueueMap[store];
                queue.push(this);
                while(queue[0] !== this) {
                    if(!queue.includes(this))
                        throw new Error("Reference not in Queue!");
                    
                    await sleep(10);
                }
            }

            while(db === undefined)
                await sleep();

            if(db === null)
                throw new Error("Connection is closed!");

            return db.transaction(Stores[store], mode);
        },
        close() {
            const queue = QueueMap[store];
            const i = queue.indexOf(this);
            if(i >= 0)
                queue.splice(i, 1);
        }
    };

    AutoCloseQueue.register(new WeakRef(ref), ref);

    return ref;
}
