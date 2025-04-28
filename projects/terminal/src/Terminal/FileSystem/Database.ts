/** /Terminal/FileSystem/Database
 * 
 * @author Alex Malotky
 */
import {openDB, IDBPDatabase, IDBPObjectStore} from "idb";
import { dirname, join, normalize, parse } from "./Path";
import { validate } from "./Mode";
import { FileError, UnauthorizedError } from "./Errors";

const DEFAULT_DRIECTORY_MODE = 775;
const DEFAULT_FILE_MODE = 664;

type StoreType = "Directory"|"File"

let db:IDBPDatabase|undefined;

export interface FolderDirectoryData {
    type: "Directory"
    owner: number
    mode: number
    links:number
    created: Date
    base: string
    path: string
}
export interface FileDirectoryData{
    type: "File"
    owner: number
    mode: number
    links:number
    created: Date
    updated: Date
    base: string
    path: string
    ext: string
}
export interface LinkDirectoryData{
    type: "Link"
    target: string
    owner: number
    mode: number
    links:number
    created: Date
    base: string
    ext?: string
    path: string
}
type DirectoryData = FolderDirectoryData|FileDirectoryData|LinkDirectoryData;
type DirectoryTransaction<M extends IDBTransactionMode> = IDBPObjectStore<DirectoryData, ["Directory"], "Directory",  M>

type FileData = string;
type FileTransaction<M extends IDBTransactionMode> = IDBPObjectStore<FileData, ["File"], "File",  M>

/** Get Database Connection
 * 
 * @returns {Promise<IDBPDatabase>}
 */
async function getConn<M extends IDBTransactionMode>(name:"Directory", mode:M):Promise<DirectoryTransaction<M>>
async function getConn<M extends IDBTransactionMode>(name:"File", mode:M):Promise<FileTransaction<M>>
async function getConn<M extends IDBTransactionMode, N extends StoreType>(name:N, mode:M):Promise<IDBPObjectStore<any, [N], N, M>>{
    if(db === undefined) {
        db = await openDB("Terminal:Filesystem", 1, {
            upgrade: async (db)=>{
                db.createObjectStore("File");
                db.createObjectStore("Directory");
            }
        });
    }
    
    return db.transaction(name, mode).objectStore(name);
}



interface DirectoryOptions {
    user: number,
    mode?: number
}

////////////////////////// Global Operations //////////////////////////////////////

/** Get Directory Info
 * 
 * @param {string} path 
 * @returns 
 */
export async function getInfo(path:string):Promise<DirectoryData|undefined> {
    path = normalize(path);
    const conn = await getConn("Directory", "readonly");

    const data:DirectoryData|undefined = await conn.get(path);

    if(data?.type === "Link") {
        const target = await getInfo(data.target);
        if(target)
            return target;
    }

    return data;
}

interface RemoveOptions {
    recursive?:boolean
    user: number
}

/** Remove Directory or File
 * 
 * @param {string} path 
 * @param {RemoveOptions} opts 
 * @param {DirectoryTransaction} rec 
 * @returns {string|null}
 */
export async function remove(path:string, opts:RemoveOptions, rec?:DirectoryTransaction<"readwrite">):Promise<string[]|null> {
    if(typeof opts.user !== "number")
        throw new TypeError("User must be a number!");

    path = normalize(path);
    const conn = rec || await getConn("Directory", "readwrite");

    const data:DirectoryData|undefined = await conn.get(path);
    if(data === undefined)
        return null;

    if(!validate(data.mode, data.owner, opts.user, "WriteOnly"))
        throw new UnauthorizedError(path, "Write");

    let files:string[]|null;
    switch(data.type){
        case "Link":
            files = await remove(data.target, opts, conn);
            break;

        case "Directory":
            const list = await readDirectory(path, opts.user);
            if(list.length > 0){
                if(opts.recursive) {
                    files = [];
                    for(const f of list){
                        const sub = await remove(join(path, f), opts, conn);
                        if(sub)
                            files = files.concat(sub);
                    }
                } else {
                    throw new FileError("Delete", `${path} is not empty!`);
                }
            } else {
                files = null;
            }
            break;

        case "File":
            files = [path];
            break;
    }

    await conn.delete(path);

    if(rec)
        return files;

    if(files) {
        const fileConn = await getConn("File", "readwrite");
        for(const file of files)
            await fileConn.delete(file);
    }
        

    return null;
}

////////////////////////// Directory Operations //////////////////////////////////////

/** Create Directory
 * 
 * @param {string} path 
 * @param {DirectoryOptions} opts 
 */
export async function createDirectory(path:string, opts:DirectoryOptions):Promise<void> {
    const {user, mode = DEFAULT_DRIECTORY_MODE} = opts;
    if(typeof user !== "number")
        throw new TypeError("User must be a number!");
    if(typeof mode !== "number")
        throw new TypeError("Mode must be a number!");

    path = normalize(path);
    const name = dirname(path);
    const conn = await getConn("Directory", "readwrite");

    if(await conn.get(path))
        throw new FileError("Create", `${path} already exists!`);

    const parrent = normalize(path, "..");
    let data:DirectoryData|undefined = await conn.get(parrent);

    while(data?.type === "Link") {
        path = normalize(data.target, "..", name);
        data = await conn.get(data.target);
    }

    if(data === undefined)
        throw new FileError("Create", `'${parrent}' does not exist!`);

    if(data.type !== "Directory")
        throw new FileError("Create", `${parrent} is not a directory!`);

    if(validate(data.mode, data.owner, user, "WriteOnly"))
        throw new UnauthorizedError(parrent, "Write");

    await conn.add({
        type: "Directory",
        base: name,
        path: parrent,
        owner: user,
        mode: mode,
        created: new Date(),
        links: 0
    } satisfies DirectoryData, path);
}

/** Read Directory
 * 
 * @param {string} path 
 * @returns {Promise<string[]>}
 */
export async function readDirectory(path:string, user:number):Promise<string[]> {
    if(typeof user !== "number")
        throw new TypeError("User must be a number!");

    path = normalize(path);
    const conn = await getConn("Directory", "readonly");
    const data:DirectoryData|undefined = await conn.get(path);
    if(data === undefined)
        throw new FileError("Read", `'${path}' does not Exist!`);

    if(data.type !== "Directory")
        throw new FileError("Read", `${path} is not a directory!`);

    const list = await conn.getAllKeys(path);
    return list.map(v=>dirname(v as string));
}

//////////////////////////// Link Operations //////////////////////////////////////

/** Link Directory of File
 * 
 * @param {string} from 
 * @param {string} to 
 * @param {DirectoryOptions} opts 
 */
export async function createLink(from:string, to:string, opts:DirectoryOptions):Promise<void> {
    const {user, mode = DEFAULT_DRIECTORY_MODE} = opts;
    if(typeof user !== "number")
        throw new TypeError("User must be a number!");
    if(typeof mode !== "number")
        throw new TypeError("Mode must be a number!");

    from = normalize(from);
    to = normalize(to);
    const name = dirname(to);
    const conn = await getConn("Directory", "readwrite");

    const target:DirectoryData|undefined = await conn.get(from);

    if(target === undefined)
        throw new FileError("Link", `${from} does not exists!`);

    if((await conn.get(to)))
        throw new FileError("Link", `${to} already exists!`);

    const parrent = normalize(to, "..");
    let data:DirectoryData|undefined = await conn.get(parrent);

    while(data?.type === "Link") {
        to = normalize(data.target, "..", name);
        data = await conn.get(data.target)
    }

    if(data === undefined)
        throw new FileError("Create", `'${parrent}' does not exist!`);

    if(data.type !== "Directory")
        throw new FileError("Create", `${parrent} is not a directory!`);

    target.links++;
    await conn.put(target, from);

    const {base, ext = undefined} = parse(to);
    await conn.add({
        type: "Link",
        path: parrent,
        owner: user,
        mode: mode,
        base: base,
        ext: ext,
        target: from,
        created: new Date(),
        links: 0
    } satisfies LinkDirectoryData, to)
}

interface UnlinkOptions {
    force?:boolean,
    recursive?:boolean
    user:number,
}

/** Unlink Options
 * 
 * @param {string} path 
 * @param {UnlinkOptions} opts 
 * @returns 
 */
export async function unlink(path:string, opts:UnlinkOptions):Promise<void> {
    const {force = false, recursive = false, user} = opts;
    if(typeof user !== "number")
        throw new TypeError("User must be a number!");

    path = normalize(path);
    const conn = await getConn("Directory", "readwrite");

    const data:DirectoryData|undefined = await conn.get(path);
    if(data === undefined)
        return;

    if(!validate(data.mode, data.owner, user, "WriteOnly"))
        throw new UnauthorizedError(path, "Write");

    if(force === false){
        if(data.links)
            throw new FileError("Unlink", `${path} still has links!`);
        
        if(data.type === "Directory" && recursive === false)
            throw new FileError("Unlink", `${path} is not empty!`);
    }
        
    if(data.type === "Directory" && recursive) {
        for(const file of await readDirectory(path, user)) {
            await unlink(join(path, file), opts);
        }
    }
    
    await conn.delete(path);
    
    if(data.type === "File") {
        await (await getConn("File", "readwrite")).delete(path)
    }
}

//////////////////////////// File Operations //////////////////////////////////////

export type WriteFileType = "Prepend"|"Append"|"Override"|"Insert";

interface FileOptions {
    user: number,
    type: WriteFileType
}

/** Create File
 * 
 * @param {string} path 
 * @param {FileOptions} opts 
 * @param {string} data 
 */
export async function createFile(path:string, opts:DirectoryOptions, data?:string):Promise<void> {
    const {user, mode = DEFAULT_FILE_MODE} = opts;
    if(typeof user !== "number")
        throw new TypeError("User must be a number!");
    if(typeof mode !== "number")
        throw new TypeError("Mode must be a number!");

    path = normalize(path);
    const {base, ext} = parse(path);
    const dirConn = await getConn("Directory", "readwrite");

    if(await dirConn.get(path))
        throw new FileError("Create", `${path} already Exists!`);

    const parrent = normalize(path, "..");
    let info:DirectoryData|undefined = await dirConn.get(parrent);

    while(info?.type === "Link") {
        path = normalize(info.target, "..", base);
        info = await dirConn.get(info.target);
    }
        
    if(info === undefined)
        throw new FileError("Create", `'${parrent}' does not Exist!`);

    if(info.type !== "Directory")
        throw new FileError("Create", `${parrent} is not a directory!`);

    if(!validate(info.mode, info.owner, user, "WriteOnly"))
        throw new UnauthorizedError(parrent, "Write");

    const now = new Date();
    await dirConn.add({
        type: "File",
        base: base,
        path: parrent,
        ext: ext,
        owner: user,
        mode: mode,
        created: now,
        updated: now,
        links: 0
    } satisfies DirectoryData, path);

    if(data){
        const conn = await getConn("File", "readwrite");
        await conn.add(data, path);
    }
}

/** Write To File
 * 
 * @param {string} path 
 * @param {FileOptions} opts 
 * @param {string} data 
 */
export async function writeToFile(path:string, opts:FileOptions, data:string):Promise<void> {
    const {user, type} = opts;
    if(typeof user !== "number")
        throw new TypeError("User must be a number!");
    
    path = normalize(path);
    const dirConn = await getConn("Directory", "readwrite");

    const info:DirectoryData|undefined = await dirConn.get(path);
    if(info === undefined)
        throw new FileError("Write", `${path} does not exisit!`);

    if(info.type !== "File")
        throw new FileError("Delete", `${path} is not a file!`);

    if( !validate(info.mode, info.owner, user, "WriteOnly")) 
        throw new UnauthorizedError(path, "Write");

    info.updated = new Date();
    await dirConn.put(info, path);

    const fileConn = await getConn("File", "readwrite");

    let buffer:string;
    if(type === "Override"){
        buffer = data;
    } else {
        buffer = await fileConn.get(path) || "";
        switch(type){
            case "Insert":
                buffer = data + buffer.substring(data.length);
                break;
    
            case "Prepend":
                buffer = data + buffer;
                break;
    
            case "Append":
                buffer += data;
                break;
    
            default:
                throw new TypeError(`Invalid Write Type: ${type}!`);
        }
    }
    
    await fileConn.put(buffer, path);
}

/** Read File
 * 
 * @param {string} path 
 * @param {number} user 
 */
export async function readFile(path:string, user:number):Promise<string> {
    if(typeof user !== "number")
        throw new TypeError("User must be a number!");

    path = normalize(path);
    const dirConn = await getConn("Directory", "readonly");

    const info:DirectoryData|undefined = await dirConn.get(path);
    if(info === undefined)
        throw new FileError("Read", `'${path}' does not Exist!`);

    if(info.type !== "File")
        throw new FileError("Read", `${path} is not a file!`);

    if(!validate(info.mode, info.owner, user, "ReadOnly"))
        throw new UnauthorizedError(path, "Read");

    const fileConn = await getConn("File", "readonly");
    return await fileConn.get(path) || "";
}