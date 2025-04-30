/** /System/Database
 * 
 * @author Alex Malotky
 */
import {openDB, IDBPDatabase, DBSchema} from "idb";

let db:IDBPDatabase<any>|undefined;

export default async function Database<T extends DBSchema|unknown>():Promise<IDBPDatabase<T>> {
    if(db === undefined) {
        db = await openDB("Terminal", 2, {
            upgrade: async(db)=>{
                db.createObjectStore("File");
                db.createObjectStore("Directory");
                const userStore = db.createObjectStore("User");
                userStore.createIndex("username", "username", {unique: true});
            }
        })
    }

    return db;
}