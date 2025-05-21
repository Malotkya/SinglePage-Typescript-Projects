/** /System/Kernel/File
 * 
 * @author Alex Malotky
 */
import { FilestoreTransaction } from "./TransactionQueue";
import { dirname, join, normalize, parse, parrent } from "../Path";
import { validate, DEFAULT_DRIECTORY_MODE, DEFAULT_FILE_MODE, formatMode } from "../Mode";
import { FileError, UnauthorizedError } from "../Errors";
import { UserId } from "../User";
import FileConnection from "./Connection";
import { DirectoryData, FileData, DirectoryValue } from "./Schema";

//Write File Types
export type WriteFileType = "Prepend"|"Append"|"Override"|"Insert"|"Rewrite";

//Write File Options
interface FileOptions {
    user: UserId|FileConnection,
    type: WriteFileType
    force?:boolean
}

//Create Directory Options
interface DirectoryOptions {
    user: UserId,
    mode?: number,
    recursive?: boolean
    soft?: boolean
}

//Move Anything Options
interface MoveOptions {
    user: UserId,
    force?: boolean,
}

/** Remove Anything Options
 * 
 */
interface RemoveOptions {
    recursive?:boolean
    user: UserId
}

/** Change Mode Options
 * 
 */
interface ChangeModeOptions {
    value:number
    user: UserId
}

/** Unlink Options
 * 
 */
interface UnlinkOptions {
    force?:boolean,
    recursive?:boolean
    user:UserId,
}

//////////////////////// Private Helper Function /////////////////////////////////

/** List All Directory*File Names
 * 
 * @param {string} path 
 * @param {FilestoreTransaction} tx 
 * @returns {Promise<string[]>}
 */
async function _dir(path:string, tx:FilestoreTransaction<"readonly"|"readwrite">):Promise<string[]> {
    return (await tx.objectStore("Directory").getAllKeys() as string[])
        .filter(s=>parrent(path, s))
        .map(dirname);
}

/** Recursivly Remove Directory
 * 
 * Returns all paths of file data that needs to be removed.
 * 
 * @param {string} path 
 * @param {RemoveOptions} opts 
 * @param {FilestoreTransaction} tx 
 * @returns {Promise<string[]>}
 */
async function _remove(path:string, opts:RemoveOptions, tx:FilestoreTransaction<"readwrite">):Promise<string[]> {
    path = normalize(path);
    const store = tx.objectStore("Directory");

    const data = await store.get(path);
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

/** Move Directory Helper Function
 * 
 * @param {string} from 
 * @param {string} to 
 * @param {boolean} clone - true for copy
 * @param {UserId} user 
 * @param {boolean} force 
 * @param {FilestoreTransaction} tx 
 * @returns {Promise<string[]>}
 */
async function _move(from:string, to:string, clone:boolean, user:UserId, force:boolean, tx:FilestoreTransaction<"readwrite">):Promise<string[]> {
    const dir = tx.objectStore("Directory");
    const file = tx.objectStore("File");

    const data = await dir.get(from);
    if(data === undefined)
        return [];

    if(!validate(data.mode, data.owner, user, "ReadWrite"))
        throw new UnauthorizedError(from, "ReadWrite");

    const target = await dir.get(to);
    if(target){
        if(!force)
            throw new FileError("Create", `${to} already exists!`);

        if(!validate(target.mode, target.owner, user, "ReadWrite"))
            throw new UnauthorizedError(to, "ReadWrite");

        if(target.type === "File") 
            file.delete(to);
    }

    let files:string[] = [];
    switch(data.type) {
        case "File":
            const buffer = await file.get(from);
            if(buffer)
                file.put(buffer, to);
            if(!clone)
                files.push(from);
            data.updated = new Date();
            break;

        case "Directory":
            for(const file of await _dir(from, tx)) {
                files = files.concat(
                    await _move(join(from, file), join(from, to), clone, user, force, tx)
                );
            }
    }

    data.created = new Date();
    data.owner = user;

    dir.put(data, to);
    if(!clone)
        dir.delete(from);

    return files;
}


////////////////////////// Global Operations //////////////////////////////////////

/** Get Directory Info
 * 
 * @param {string} path 
 * @returns 
 */
export async function getInfo(path:string, tx:FilestoreTransaction<"readonly">):Promise<DirectoryValue|undefined> {
    path = normalize(path);

    const data = await tx.objectStore("Directory").get(path);

    if(data?.type === "Link") {
        const target = await getInfo(data.target, tx);
        if(target)
            return target;
    }

    return data;
}

/** Get Size of File or Directory
 * 
 * @param {string} path 
 * @param {FilestoreTransaction} tx 
 * @returns {Promise<number>}
 */
export async function getSize(path:string, tx:FilestoreTransaction<"readonly">):Promise<number> {
    path = normalize(path);
    const store = tx.objectStore("Directory");

    let data = await store.get(path);
    while(data?.type === "Link") {
        data = await store.get(data.target);
    }

    if(data === undefined)
        throw new FileError("Read", `${path} does not exist!`);

    if(data.type === "File") {
        const file = await tx.objectStore("File").get(path);
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


/** Remove Directory or File
 * 
 * @param {string} path 
 * @param {RemoveOptions} opts 
 * @param {DirectoryTransaction} rec 
 * @returns {string|null}
 */
export async function remove(path:string, opts:RemoveOptions, tx:FilestoreTransaction<"readwrite">):Promise<void> {
    const files = await _remove(path, opts, tx);
    const store = tx.objectStore("File");

    for(const f of files){
        await store.delete(f);
    }
}

/** Copy File or Directory
 * 
 * @param {string} from 
 * @param {string} to 
 * @param {MoveOptions} opts 
 * @param {FilestoreTransaction} tx 
 */
export async function copy(from:string, to:string, opts:MoveOptions, tx:FilestoreTransaction<"readwrite">):Promise<void> {
    from = normalize(from);
    to = normalize(to);
    await _move(from, to, true, opts.user, opts.force || false, tx);
}

/** Move File or Directory
 * 
 * @param {string} from 
 * @param {string} to 
 * @param {MoveOptions} opts 
 * @param {FileSystem} tx 
 */
export async function move(from:string, to:string, opts:MoveOptions, tx:FilestoreTransaction<"readwrite">):Promise<void> {
    from = normalize(from);
    to = normalize(to);
    const store = tx.objectStore("File")
    for(const file of await _move(from, to, false, opts.user, opts.force || false, tx))
        store.delete(file);
}

/** Change Mode
 * 
 * @param {string} path 
 * @param {ChangeModeOptions} opts 
 * @param {FilestoreTransaction} 
 */
export async function changeMode(path:string, opts:ChangeModeOptions, tx:FilestoreTransaction<"readwrite">):Promise<void> {
    const {user, value} = opts;
    if(typeof value !== "number")
        throw new TypeError("Mode must be a number!");

    path = normalize(path);
    const store = tx.objectStore("Directory");

    const data = await store.get(path);
    if(data === undefined)
        throw new FileError("Write", `${path} does not exsist!`);

    if(!validate(data.mode, data.owner, user, "WriteOnly"))
        throw new UnauthorizedError(path, "Write");

    data.mode = formatMode(value);
    if(data.type === "File")
        data.updated = new Date();
    
    store.put(data, path);
}

////////////////////////// Directory Operations //////////////////////////////////////

/** Create Directory
 * 
 * @param {string} path 
 * @param {DirectoryOptions} opts 
 */
export async function createDirectory(path:string, opts:DirectoryOptions, tx:FilestoreTransaction<"readwrite">):Promise<DirectoryData> {
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
    let data = await store.get(parrent);

    while(data?.type === "Link") {
        path = normalize(data.target, "..", name);
        data = await store.get(data.target);
    }

    if(data === undefined) {
        if(opts.recursive) {
            data = await createDirectory(parrent, opts, tx)!;
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
export async function readDirectory(path:string, user:UserId, tx:FilestoreTransaction<"readonly">):Promise<string[]> {
    path = normalize(path);

    const data = await tx.objectStore("Directory").get(path);
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
export async function createLink(from:string, to:string, opts:DirectoryOptions, tx:FilestoreTransaction<"readwrite">):Promise<void> {
    const {user, mode = DEFAULT_DRIECTORY_MODE} = opts;
    if(typeof mode !== "number")
        throw new TypeError("Mode must be a number!");

    from = normalize(from);
    to = normalize(to);
    const name = dirname(to);
    const store = tx.objectStore("Directory");

    const target = await store.get(from);

    if(target === undefined)
        throw new FileError("Link", `${from} does not exists!`);

    if((await store.get(to)))
        throw new FileError("Link", `${to} already exists!`);

    const parrent = normalize(to, "..");
    let data = await store.get(parrent);

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
    }, to)
}



/** Unlink Options
 * 
 * @param {string} path 
 * @param {UnlinkOptions} opts 
 * @returns 
 */
export async function unlink(path:string, opts:UnlinkOptions, tx:FilestoreTransaction<"readwrite">):Promise<void> {
    const {force = false, recursive = false, user} = opts;

    path = normalize(path);
    const store = tx.objectStore("Directory");

    const data = await store.get(path);
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

/** Create File
 * 
 * @param {string} path 
 * @param {DirectoryOptions} opts 
 * @param {string} data 
 */
export async function createFile(path:string, opts:DirectoryOptions, tx:FilestoreTransaction<"readwrite">, data?:FileData):Promise<void> {
    const {user, mode = DEFAULT_FILE_MODE, soft = false} = opts;
    if(typeof mode !== "number")
        throw new TypeError("Mode must be a number!");

    path = normalize(path);
    const {base, ext} = parse(path);
    const store = tx.objectStore("Directory");

    if((await store.get(path)) === undefined) {

        const parrent = normalize(path, "..");
        let info = await store.get(parrent);

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
        }, path);
    } else  if(!soft) {
        throw new FileError("Create", `${path} already Exists!`);
    }

    if(data){
        await tx.objectStore("File").put(data, path);
    }
}

/** Write To File
 * 
 * @param {string} path 
 * @param {FileOptions} opts 
 * @param {string} data 
 */
export async function writeToFile(path:string, opts:FileOptions, data:FileData, tx:FilestoreTransaction<"readwrite">):Promise<void> {
    const {user, type, force} = opts;
    
    path = normalize(path);
    const store = tx.objectStore("Directory");

    const info = await store.get(path);
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

    let buffer:Uint8Array;
    if(type === "Rewrite"){
        buffer = data;
    } else {
        const content = await file.get(path) || new Uint8Array();
        switch(type){
            case "Override":
            case "Insert":
                buffer = new Uint8Array(Math.max(data.length,content.length));
                buffer.set(data);
                buffer.set(content.slice(data.length), data.length);
                break;
    
            case "Prepend":
                buffer = new Uint8Array(data.length+content.length);
                buffer.set(data);
                buffer.set(content, data.length);
                break;
    
            case "Append":
                buffer = new Uint8Array(data.length+content.length);
                buffer.set(content);
                buffer.set(data, content.length);
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
export async function readFile(path:string, user:UserId, tx:FilestoreTransaction<"readonly">):Promise<FileData> {
    path = normalize(path);

    const info = await tx.objectStore("Directory").get(path);
    if(info === undefined)
        throw new FileError("Read", `'${path}' does not Exist!`);

    if(info.type !== "File")
        throw new FileError("Read", `${path} is not a file!`);

    if(!validate(info.mode, info.owner, user, "ReadOnly"))
        throw new UnauthorizedError(path, "Read");

    return await tx.objectStore("File").get(path) || new Uint8Array();
}

export async function openFile(path:string, user:UserId, mode:"ReadOnly"|"WriteOnly"|"ReadWrite", tx:FilestoreTransaction<"readwrite">):Promise<FileConnection> {
    path = normalize(path);

    const info = await tx.objectStore("Directory").get(path);
    if(info === undefined)
        throw new FileError("Open",`'${path}' does not Exist!`);

    if(info.type !== "File")
        throw new FileError("Open", `${path} is not a file!`);

    if(!validate(info.mode, info.owner, user, mode))
        throw new UnauthorizedError(path, mode);

    info.links += 1;
    await tx.objectStore("Directory").put(info, path);

    return new FileConnection(path, await tx.objectStore("File").get(path) || new Uint8Array());
}

export async function closeFile(conn:FileConnection, tx:FilestoreTransaction<"readwrite">):Promise<void> {
    const path = conn.fileName? normalize(conn.fileName): undefined;
    if(path) {
        const store = tx.objectStore("Directory");

        const info = await store.get(path);
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
export async function executable(path:string, user:UserId, tx:FilestoreTransaction<"readonly">):Promise<string> {
    path = normalize(path);

    const info = await tx.objectStore("Directory").get(path);
    if(info === undefined)
        throw new FileError("Execute", `'${path}' does not Exist!`);

    if(info.type !== "File")
        throw new FileError("Execute", `${path} is not a file!`);

    if(!validate(info.mode, info.owner, user, "ExecuteOnly"))
        throw new UnauthorizedError(path, "Execute");

    const data = await tx.objectStore("File").get(path);
    if(data)
        return new TextDecoder("utf-8").decode(data);

    return "";
}