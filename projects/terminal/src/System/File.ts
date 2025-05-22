/** /System/File
 * 
 * @author Alex Malotky
 */
import Queue from "./Kernel/File/TransactionQueue";
import * as db from "./Kernel/File";
import {Path} from "./Kernel";
import User, {getUserById} from "./User";
import FileStream, {ReadFileStream, WriteFileStream, ReadWriteFileStream} from "./Kernel/Stream/File";
import Encoding, {encodeValue} from "./Kernel/Encoding";

let location:string = "/";

/** Get Current Location
 * 
 * @returns {string}
 */
export function currentLocation():string {
    return location;
}

///////////////////////////// Option Interfaces /////////////////////////////

export interface LinkOptions {
    mode?:number
}

export interface UnlinkOptions {
    force?:boolean
    recursive?:boolean
}

export interface MoveOptions {
    force?: boolean
}

export interface MakeDirectoryOptions {
    recursive?: boolean
    soft?: boolean
    chmod?: number
}

export interface RemoveOptions {
    recursive?:boolean
    force?:boolean
}

export interface WriteFileOptions {
    type?: db.WriteFileType
    force?: boolean
}

//////////////////////////// File System Interface ///////////////////////////////

/** File System
 * 
 */
const fs = {

    /** Change Current Location to Directory
     * 
     * @param {string} path 
     */
    async cd(path:string):Promise<void> {
        path = await Path.format(path);

        const data = await this.stats(path);
        if(data === null){
            throw new Error("Unable to find directory: " + path);
        } else if(!data.isDiretory()) {
            throw new Error(`${path} is not a directory!`);
        }

        location = path;
    },

    /** Link to File or Directory
     * 
     * @param {string} from 
     * @param {string} to 
     * @param {LinkOptions} opts 
     */
    async link(from:string, to:string, opts:LinkOptions = {}):Promise<void> {
        const ref = Queue("readwrite");
        await db.createLink(from, to, {
            ...opts,
            user: User.id
        }, await ref.open());
        ref.close();
    },

    /** Unlink File or Directory
     * 
     * Will delete file or directoy if base location is chosen
     * 
     * @param {string} path 
     * @param {UnlinkOptions} opts 
     */
    async unlink(path:string, opts:UnlinkOptions = {}):Promise<void> {
        path = await Path.format(path);

        const ref = Queue("readwrite");
        db.unlink(path, {
            ...opts,
            user: User.id
        }, await ref.open());
        ref.close();
    },

    /** Remove File or Dirctory
     * 
     * @param {string} path 
     * @param {RemoveOptions} opts 
     */
    async rm(path:string, opts:RemoveOptions = {}):Promise<void> {
        path = await Path.format(path);

        const ref = Queue("readwrite");
        await db.remove(path, {
            ...opts,
            user: User.id
        }, await ref.open());
    },

    /** Get Stats
     * 
     * @param {string} path 
     * @returns {Promise<SystemStats|null>}
     */
    async stats(path:string):Promise<SystemStats|null> {
        path = await Path.format(path);

        const ref = Queue("readonly");

        const info  = await db.getInfo(path, await ref.open());
        const about = Path.parse(path);
        ref.close();
    
        if(info === undefined)
            return null;
    
        //Detect Successfull Link
        if(info.path !== about.path) {
            return {
                name: about.name,
                base: about.base,
                ext: about.ext,
                path: about.path,
                created: info.created,
                updated: (info as any).updated,
                owner: (await getUserById(info.owner))?.username || "Guest",
                links: info.links,
                mode: info.mode,
                isLink(): true{
                    return true;
                },
                isFile() {
                    return (info.type === "File") as true
                },
                isDiretory() {
                    return (info.type === "Directory") as false
                }
            } satisfies LinkSystemStats
        }
    
        return {
            name: about.name,
            base: info.base,
            ext: (info as any).ext,
            created: info.created,
            owner: (await getUserById(info.owner))?.username || "Guest",
            links: info.links,
            mode: info.mode,
            path: info.path,
            target: (info as any).target,
            isFile() {
                return (info.type === "File") as false;
            },
            isDiretory() {
                return (info.type === "Directory") as false;
            },
            isLink() {
                return (info.type === "Link") as true
            }
    
        } satisfies FileSystemStats|DirectorySystemStats|BrokenLinkSystemStats
    },

    /** Get Size of File or Directory
     * 
     * @param {string} path 
     * @returns {Promise<number>}
     */
    async size(path:string):Promise<number> {
        path = await Path.format(path);

        const ref = Queue("readonly");
        const result =  await db.getSize(path, await ref.open());
        ref.close();
        return result;
    },

    /** File or Directory Exists
     * 
     * @param {string} path 
     * @returns {Promise<boolean>}
     */
    async exists(path:string):Promise<boolean>{
        path = await Path.format(path);

        const ref = Queue("readonly");
        const result = await db.getInfo(path, await ref.open());
        ref.close();
        return result !== undefined;
    },

    /** Move Directory or File
     * 
     * @param {string} from 
     * @param {string} to 
     */
    async move(from:string, to:string, opts:MoveOptions = {}):Promise<void> {
        from = await Path.format(from);
        to   = await Path.format(to);

        const ref = Queue("readwrite");
        await db.move(from, to, {
            force: opts.force,
            user: User.id
        }, await ref.open());
        ref.close();
    },

    /** Copy Directory or File
     * 
     * @param {string} from 
     * @param {string} to 
     */
    async copy(from:string, to:string, opts:MoveOptions = {}):Promise<void> {
        from = await Path.format(from);
        to   = await Path.format(to);

        const ref = Queue("readwrite");
        await db.copy(from, to, {
            force: opts.force,
            user: User.id
        }, await ref.open());
        ref.close();
    },

    /** Rename Directory or File
     * 
     * @param {string} from 
     * @param {string} to 
     */
    async rename(from:string, to:string, opts:MoveOptions = {}):Promise<void> {
        from = await Path.format(from);
        to   = await Path.format(to);

        const ref = Queue("readwrite");
        await db.move(from, to, {
            force: opts.force,
            user: User.id
        }, await ref.open());
        ref.close();
    },

    /** Change Mode
     * 
     * @param {string} path 
     */
    async chmod(path:string, value:number){
        path = await Path.format(path);

        const ref = Queue("readwrite");
        db.changeMode(path, {
            value,
            user: User.id
        }, await ref.open());
        ref.close();
    },

    /** Make Directory
     * 
     * @param {string} path 
     * @param {MakeDirectoryOptions} opts 
     */
    async mkdir(path:string, opts:MakeDirectoryOptions = {}):Promise<void> {
        path = await Path.format(path);

        const ref = Queue("readwrite");
        await db.createDirectory(path, {
            ...opts,
            user: User.id
        }, await ref.open());
        ref.close();
    },

    /** Read Directory
     * 
     * @param {string} path 
     * @returns {Promise<string[]>}
     */
    async readdir(path:string):Promise<string[]> {
        path = await Path.format(path);

        const ref = Queue("readonly");
        const results = await db.readDirectory(path, User.id, await ref.open());
        ref.close();
        return results;
    },

    /** Make File
     * 
     */
    async mkfile(path:string, opts:MakeDirectoryOptions = {}, data?:any):Promise<void> {
        path = await Path.format(path);

        const ref = Queue("readwrite");
        await db.createFile(path, {
            ...opts,
            user: User.id
        }, await ref.open(), data? encodeValue(data): undefined);
        ref.close();
    },

    /** Write File
     * 
     * @param {string} path 
     * @param {string} data 
     * @param {WriteFileOptions} opts 
     */
    async writefile(path:string, data:any, opts:WriteFileOptions = {}):Promise<void> {
        path = await Path.format(path);

        const ref = Queue("readwrite");
        const tx = await ref.open();
        if(undefined !== await db.getInfo(path, tx as any)) {
            await db.writeToFile(path, {
                user: User.id,
                type: opts.type || "Override"
            }, encodeValue(data), tx);

        } else if(opts.force){
            await db.createFile(path, {
                recursive: true,
                user: User.id
            }, tx, data);
        }
        ref.close();
    },

    /** Read File
     * 
     * @param {string} path 
     * @returns {Promise<string>}
     */
    async readfile(path:string):Promise<Encoding> {
        path = await Path.format(path);

        const ref = Queue("readonly");
        const result = await db.readFile(path, User.id, await ref.open());
        ref.close();
        return new Encoding(result);
    },

    /** Open File
     * 
     * @param {string} path 
     * @returns {Promise<stream>}
     */
    openfile: async function openFile(path:string, type:"ReadOnly"|"WriteOnly"|"ReadWrite", mode:db.WriteFileType = "Append"):Promise<FileStream>{
        path = await Path.format(path);
    
        const ref = Queue("readwrite"); 
        const conn = await db.openFile(path, User.id, type, await ref.open());
        ref.close();
    
        switch(type){
            case "ReadOnly":
                return new ReadFileStream(conn);
    
            case "WriteOnly":
                return new WriteFileStream(conn, mode);
    
            case "ReadWrite":
                return new ReadWriteFileStream(conn, mode);
        }
    }  as {
        (path:string, type:"ReadOnly"):Promise<ReadFileStream>
        (path:string, type:"WriteOnly", mode?:db.WriteFileType):Promise<WriteFileStream>
        (path:string, type:"ReadWrite", mode?:db.WriteFileType):Promise<ReadWriteFileStream>
    }
}
export default fs;

//////////////////////////// System State Interface ///////////////////////////////

/** Linked File
 * 
 */
export interface LinkedFileStat {
    name: string
    base: string
    ext:string
    created: Date
    updated: Date
    owner: string
    links: number
    mode: number
    path: string
    isFile(): true
    isDiretory(): false
    isLink(): true
}

/** Linked Directory
 * 
 */
export interface LinkedDirectoryStat {
    name: string
    base: string
    created: Date
    owner: string
    links: number
    mode: number
    path: string
    isFile(): false
    isDiretory(): true
    isLink(): true
}

/** Broken Link
 * 
 */
export interface BrokenLinkSystemStats {
    name: string
    base: string
    ext?: string
    created: Date
    owner: string
    links: number
    mode: number
    path: string
    target: string
    isFile(): false
    isDiretory(): false
    isLink(): true
}
type LinkSystemStats = LinkedFileStat|LinkedDirectoryStat;

/** File
 * 
 */
export interface FileSystemStats {
    name: string
    base: string
    ext: string
    created: Date
    owner: string
    links: number
    mode: number
    path: string
    isFile(): true
    isDiretory(): false
    isLink(): false
}

/** Directory
 * 
 */
export interface DirectorySystemStats {
    name: string
    base: string
    created: Date
    owner: string
    links: number
    mode: number
    path: string
    isFile(): false
    isDiretory(): true
    isLink(): false
}

export type SystemStats = FileSystemStats|DirectorySystemStats|BrokenLinkSystemStats|LinkSystemStats
