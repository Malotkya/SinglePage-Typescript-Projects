/** /System/Files/Database
 * 
 * @author Alex Malotky
 */
import { DatabaseTransaction } from "../Database";
import { dirname, join, normalize, parse, parrent } from "./Path";
import { validate } from "./Mode";
import { FileError, UnauthorizedError } from "./Errors";
import { ROOT_USER_ID, UserId } from "../User";
import FileConnection from "./Connection";

const DEFAULT_DRIECTORY_MODE = 775;
const DEFAULT_FILE_MODE = 664;
const DEFAULT_ROOT_MODE = 755;

export interface InitData {
    [name:string]:string|InitData
}

export interface FolderDirectoryData {
    type: "Directory"
    owner: UserId
    mode: number
    links:number
    created: Date
    base: string
    path: string
}
export interface FileDirectoryData{
    type: "File"
    owner: UserId
    mode: number
    links:number
    listeners: number
    created: Date
    updated: Date
    path: string
    base: string
    ext: string
}
export interface LinkDirectoryData{
    type: "Link"
    target: string
    owner: UserId
    mode: number
    links:number
    created: Date
    base: string
    ext?: string
    path: string
}
type DirectoryData = FolderDirectoryData|FileDirectoryData|LinkDirectoryData;
type FileData = string;

export type FileSystemTransaction<M extends IDBTransactionMode = "readonly"> = DatabaseTransaction<M, "FileSystem">

interface DirectoryOptions {
    user: UserId,
    mode?: number,
    recursive?: boolean
    soft?: boolean
}
//////////////////////// Private Helper Function /////////////////////////////////

async function _dir(path:string, tx:FileSystemTransaction<any>):Promise<string[]> {
    return (await tx.objectStore("Directory").getAllKeys() as string[])
        .filter(s=>parrent(path, s))
        .map(dirname);
}

/** Build Directory
 * 
 * @param {string} path 
 * @param {InitData} init 
 */
async function _build(path:string, init:InitData, tx:FileSystemTransaction<"readwrite">) {
    const dir  = tx.objectStore("Directory");
    const file = tx.objectStore("File");
    for(const name in init){
        const filePath = join(path, name);
        let data:DirectoryData|undefined = await dir.get(filePath);

        //Build File
        if(typeof init[name] === "string") {
            
            //Update
            if(data) {
                (data as FileDirectoryData).updated = new Date();

            //Create
            } else {
                const [base, ext = ""] = name.split(".");
                data = {
                    type: "File",
                    owner: ROOT_USER_ID,
                    mode: DEFAULT_ROOT_MODE,
                    base: base,
                    ext: ext,
                    links: 0,
                    listeners: 0,
                    created: new Date(),
                    updated: new Date(),
                    path: path
                } satisfies FileDirectoryData;
            }

            //Save
            await dir.put(data, filePath);
            await file.put(init[name], filePath);

        //Build Directory
        } else {

            //Create
            if(data === undefined){
                await dir.add({
                    type: "Directory",
                    owner: ROOT_USER_ID,
                    mode: DEFAULT_ROOT_MODE,
                    links: 0,
                    created: new Date(),
                    base: name,
                    path: path
                } satisfies FolderDirectoryData, filePath)
            }

            //Populate Directory
            await _build(filePath, init[name], tx);
        }
    }
}

async function _remove(path:string, opts:RemoveOptions, tx:FileSystemTransaction<"readwrite">):Promise<string[]> {
    path = normalize(path);
    const store = tx.objectStore("Directory");

    const data:DirectoryData|undefined = await store.get(path);
    if(data === undefined)
        return [];

    if(!validate(data.mode, data.owner, opts.user, "WriteOnly"))
        throw new UnauthorizedError(path, "Write");

    let files:string[];
    switch(data.type){
        case "Link":
            files = await _remove(data.target, opts, tx);
            break;

        case "Directory":
            const list = await _dir(path, tx);
            if(list.length > 0){
                if(opts.recursive) {
                    files = [];
                    for(const f of list){
                        const sub = await _remove(join(path, f), opts, tx);
                        if(sub)
                            files = files.concat(sub);
                    }
                } else {
                    throw new FileError("Delete", `${path} is not empty!`);
                }
            } else {
                files = [];
            }
            break;

        case "File":
            files = [path];
            break;
    }

    await store.delete(path);
    return files;
}


////////////////////////// Global Operations //////////////////////////////////////

export async function init(data:InitData = {}, tx:FileSystemTransaction<"readwrite">):Promise<void> {
    const store = tx.objectStore("Directory");

    if(await store.get("/") === undefined) {
        await store.put({
            type: "Directory",
            owner: ROOT_USER_ID,
            mode: DEFAULT_ROOT_MODE,
            links: 0,
            created: new Date(),
            base: "",
            path: "/"
        } satisfies FolderDirectoryData, "/");
    }

    await _build("/", data, tx);
}

/** Get Directory Info
 * 
 * @param {string} path 
 * @returns 
 */
export async function getInfo(path:string, tx:FileSystemTransaction):Promise<DirectoryData|undefined> {
    path = normalize(path);

    const data:DirectoryData|undefined = await tx.objectStore("Directory").get(path);

    if(data?.type === "Link") {
        const target = await getInfo(data.target, tx);
        if(target)
            return target;
    }

    return data;
}

export async function getSize(path:string, tx:FileSystemTransaction):Promise<number> {
    path = normalize(path);
    const store = tx.objectStore("Directory");

    let data:DirectoryData|undefined = await store.get(path);
    while(data?.type === "Link") {
        data = await store.get(data.target);
    }

    if(data === undefined)
        throw new FileError("Read", `${path} does not exist!`);

    if(data.type === "File") {
        const file:string|undefined = await tx.objectStore("File").get(path);
        if(file){
            return file.length;
        }

        return 0;
    }

    let output = 0;
    const list = await _dir(path, tx)
    for(const file of list) {
        output += await getSize(join(path, file), tx);
    }

    return output;
}

interface RemoveOptions {
    recursive?:boolean
    user: UserId
}

/** Remove Directory or File
 * 
 * @param {string} path 
 * @param {RemoveOptions} opts 
 * @param {DirectoryTransaction} rec 
 * @returns {string|null}
 */
export async function remove(path:string, opts:RemoveOptions, tx:FileSystemTransaction<"readwrite">):Promise<void> {
    const files = await _remove(path, opts, tx);
    const store = tx.objectStore("File");

    for(const f of files){
        await store.delete(f);
    }
}

////////////////////////// Directory Operations //////////////////////////////////////

/** Create Directory
 * 
 * @param {string} path 
 * @param {DirectoryOptions} opts 
 */
export async function createDirectory(path:string, opts:DirectoryOptions, tx:FileSystemTransaction<"readwrite">):Promise<DirectoryData> {
    const {user, mode = DEFAULT_DRIECTORY_MODE, soft = false} = opts;
    if(typeof mode !== "number")
        throw new TypeError("Mode must be a number!");

    path = normalize(path);
    const name = dirname(path);
    const store = tx.objectStore("Directory")

    const info = await store.get(path);
    if(info) {
        if(soft)
            return info;

        throw new FileError("Create", `${path} already exists!`);
    }
        

    const parrent = normalize(path, "..");
    let data:DirectoryData|undefined = await store.get(parrent);

    while(data?.type === "Link") {
        path = normalize(data.target, "..", name);
        data = await store.get(data.target);
    }

    if(data === undefined) {
        if(opts.recursive) {
            data = await createDirectory(parrent, opts, tx);
        } else {
            throw new FileError("Create", `'${parrent}' does not exist!`);
        }
    }

    if(data.type !== "Directory")
        throw new FileError("Create", `${parrent} is not a directory!`);

    if(!validate(data.mode, data.owner, user, "WriteOnly"))
        throw new UnauthorizedError(parrent, "Write");

    const output:DirectoryData = {
        type: "Directory",
        base: name,
        path: parrent,
        owner: user,
        mode: mode,
        created: new Date(),
        links: 0
    };

    await store.add(output, path);
    return output;
}

/** Read Directory
 * 
 * @param {string} path 
 * @returns {Promise<string[]>}
 */
export async function readDirectory(path:string, user:UserId, tx:FileSystemTransaction):Promise<string[]> {
    path = normalize(path);

    const data:DirectoryData|undefined = await tx.objectStore("Directory").get(path);
    if(data === undefined)
        throw new FileError("Read", `'${path}' does not Exist!`);

    if(data.type !== "Directory")
        throw new FileError("Read", `${path} is not a directory!`);

    if(!validate(data.mode, data.owner, user, "ReadOnly"))
        throw new UnauthorizedError(path, "Read");

    return await _dir(path, tx);
}

//////////////////////////// Link Operations //////////////////////////////////////

/** Link Directory of File
 * 
 * @param {string} from 
 * @param {string} to 
 * @param {DirectoryOptions} opts 
 */
export async function createLink(from:string, to:string, opts:DirectoryOptions, tx:FileSystemTransaction<"readwrite">):Promise<void> {
    const {user, mode = DEFAULT_DRIECTORY_MODE} = opts;
    if(typeof mode !== "number")
        throw new TypeError("Mode must be a number!");

    from = normalize(from);
    to = normalize(to);
    const name = dirname(to);
    const store = tx.objectStore("Directory");

    const target:DirectoryData|undefined = await store.get(from);

    if(target === undefined)
        throw new FileError("Link", `${from} does not exists!`);

    if((await store.get(to)))
        throw new FileError("Link", `${to} already exists!`);

    const parrent = normalize(to, "..");
    let data:DirectoryData|undefined = await store.get(parrent);

    while(data?.type === "Link") {
        to = normalize(data.target, "..", name);
        data = await store.get(data.target)
    }

    if(data === undefined)
        throw new FileError("Create", `'${parrent}' does not exist!`);

    if(data.type !== "Directory")
        throw new FileError("Create", `${parrent} is not a directory!`);

    target.links++;
    await store.put(target, from);

    const {base, ext = undefined} = parse(to);
    await store.add({
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
    user:UserId,
}

/** Unlink Options
 * 
 * @param {string} path 
 * @param {UnlinkOptions} opts 
 * @returns 
 */
export async function unlink(path:string, opts:UnlinkOptions, tx:FileSystemTransaction<"readwrite">):Promise<void> {
    const {force = false, recursive = false, user} = opts;

    path = normalize(path);
    const store = tx.objectStore("Directory");

    const data:DirectoryData|undefined = await store.get(path);
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
        for(const file of await _dir(path, tx)) {
            await unlink(join(path, file), opts, tx);
        }
    }
    
    await store.delete(path);
    
    if(data.type === "File") {
        await tx.objectStore("File").delete(path)
    }
}

//////////////////////////// File Operations //////////////////////////////////////

export type WriteFileType = "Prepend"|"Append"|"Override"|"Insert"|"Rewrite";

interface FileOptions {
    user: UserId|FileConnection,
    type: WriteFileType
    force?:boolean
}

/** Create File
 * 
 * @param {string} path 
 * @param {DirectoryOptions} opts 
 * @param {string} data 
 */
export async function createFile(path:string, opts:DirectoryOptions, tx:FileSystemTransaction<"readwrite">, data?:string):Promise<void> {
    const {user, mode = DEFAULT_FILE_MODE, soft = false} = opts;
    if(typeof mode !== "number")
        throw new TypeError("Mode must be a number!");

    path = normalize(path);
    const {base, ext} = parse(path);
    const store = tx.objectStore("Directory");

    if((await store.get(path)) === undefined) {

        const parrent = normalize(path, "..");
        let info:DirectoryData|undefined = await store.get(parrent);

        while(info?.type === "Link") {
            path = normalize(info.target, "..", base);
            info = await store.get(info.target);
        }
            
        if(info === undefined) {
            if(opts.recursive) {
                info = await createDirectory(parrent, opts, tx);
            } else {
                throw new FileError("Create", `'${parrent}' does not Exist!`);
            }
        }

        if(info.type !== "Directory")
            throw new FileError("Create", `${parrent} is not a directory!`);

        if(!validate(info.mode, info.owner, user, "WriteOnly"))
            throw new UnauthorizedError(parrent, "Write");

        const now = new Date();
        await store.add({
            type: "File",
            base: base,
            path: parrent,
            ext: ext,
            owner: user,
            mode: mode,
            created: now,
            updated: now,
            links: 0,
            listeners: 0
        } satisfies DirectoryData, path);
    } else  if(!soft) {
        throw new FileError("Create", `${path} already Exists!`);
    }

    if(data){
        await tx.objectStore("File").add(data, path);
    }
}

/** Write To File
 * 
 * @param {string} path 
 * @param {FileOptions} opts 
 * @param {string} data 
 */
export async function writeToFile(path:string, opts:FileOptions, data:string, tx:FileSystemTransaction<"readwrite">):Promise<void> {
    const {user, type, force} = opts;
    
    path = normalize(path);
    const store = tx.objectStore("Directory");

    const info:DirectoryData|undefined = await store.get(path);
    if(info === undefined) {
        if(force){
            await createFile(path, {
                user: user as UserId,
                recursive: true
            }, tx, data);
            return 
        } else {
            throw new FileError("Write", `${path} does not exisit!`);
        }
    }

    if(info.type !== "File")
        throw new FileError("Delete", `${path} is not a file!`);

    if( !(user instanceof FileConnection) && !validate(info.mode, info.owner, user, "WriteOnly")) 
        throw new UnauthorizedError(path, "Write");

    info.updated = new Date();
    await store.put(info, path);

    const file = tx.objectStore("File");

    let buffer:string;
    if(type === "Rewrite"){
        buffer = data;
    } else {
        buffer = await file.get(path) || "";
        switch(type){
            case "Override":
                buffer = data + buffer.substring(data.length);
                break;
    
            case "Prepend":
            case "Insert":
                buffer = data + buffer;
                break;
    
            case "Append":
                buffer += data;
                break;
    
            default:
                throw new TypeError(`Invalid Write Type: ${type}!`);
        }
    }
    
    await file.put(buffer, path);
    new BroadcastChannel(path).postMessage({
        name: user,
        value: buffer
    });
}

/** Read File
 * 
 * @param {string} path 
 * @param {number} user 
 */
export async function readFile(path:string, user:UserId, tx:FileSystemTransaction):Promise<FileData> {
    path = normalize(path);

    const info:DirectoryData|undefined = await tx.objectStore("Directory").get(path);
    if(info === undefined)
        throw new FileError("Read", `'${path}' does not Exist!`);

    if(info.type !== "File")
        throw new FileError("Read", `${path} is not a file!`);

    if(!validate(info.mode, info.owner, user, "ReadOnly"))
        throw new UnauthorizedError(path, "Read");

    return await await tx.objectStore("File").get(path) || "";
}

export async function openFile(path:string, user:UserId, mode:"ReadOnly"|"WriteOnly"|"ReadWrite", tx:FileSystemTransaction<"readwrite">):Promise<FileConnection> {
    path = normalize(path);

    const info:DirectoryData|undefined = await tx.objectStore("Directory").get(path);
    if(info === undefined)
        throw new FileError("Open",`'${path}' does not Exist!`);

    if(info.type !== "File")
        throw new FileError("Open", `${path} is not a file!`);

    if(!validate(info.mode, info.owner, user, mode))
        throw new UnauthorizedError(path, mode);

    info.links += 1;
    await tx.objectStore("Directory").put(info, path);

    return new FileConnection(path, await tx.objectStore("File").get(path) || "");
}

export async function closeFile(conn:FileConnection, tx:FileSystemTransaction<"readwrite">):Promise<void> {
    const path = conn.fileName? normalize(conn.fileName): undefined;
    if(path) {
        const store = tx.objectStore("Directory");

        const info:DirectoryData|undefined = await store.get(path);
        if(info && info.type === "File"){
            info.listeners -= 1;

            store.put(info, path);
        }
    }
}

/** Read Executable
 * 
 * @param {string} path 
 * @param {UserId} user 
 * @returns {Promise<FileData>}
 */
export async function executable(path:string, user:UserId, tx:FileSystemTransaction):Promise<FileData> {
    path = normalize(path);

    const info:DirectoryData|undefined = await tx.objectStore("Directory").get(path);
    if(info === undefined)
        throw new FileError("Execute", `'${path}' does not Exist!`);

    if(info.type !== "File")
        throw new FileError("Execute", `${path} is not a file!`);

    if(!validate(info.mode, info.owner, user, "ExecuteOnly"))
        throw new UnauthorizedError(path, "Execute");

    return await tx.objectStore("File").get(path) || "";
}