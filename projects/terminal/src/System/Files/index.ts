/** /System/Files
 * 
 * @author Alex Malotky
 */
import Stream from "../Stream";
import * as db from "./Database";
import { InitData } from "./Database";
import * as Path from "./Path";
import FileSystem from "./Process";
import {Process} from "..";
import { fromFile } from "../Script";
import { FileError } from "./Errors";
import User, {getUserById} from "../User";
export {FileSystem, InitData};

///////////////////////////// Option Interfaces /////////////////////////////

export interface LinkOptions {
    mode?:number
}

export interface UnlinkOptions {
    force?:boolean
    recursive?:boolean
}

export interface MakeDirectoryOptions {
    recursive?: boolean
    chmod?: number
}

export interface RemoveOptions {
    recursive?:boolean
}

export interface WriteFileOptions {
    type?: db.WriteFileType
    force?: boolean
}

export function init(data?:InitData) {
    return db.init(data);
}

export async function executable(file:string, skip?:boolean):Promise<Process|null> {
    const {base} = Path.parse(file);
    try {
        const data:Record<string, string> = {
            name: base
        };
        let buffer = await db.executable(file, await User.id());

        let match:RegExpMatchArray|null = buffer.match(/^([a-z]+):/im);
        let name:string = "*";

        while(match !== null) {
            const index = buffer.indexOf(match[0]);
            const newName = match[1].toLocaleLowerCase();
            const value = buffer.substring(0, index);
            buffer = buffer.substring(index+match[0].length);

            data[name.toLocaleLowerCase().trim()] = value;
            name = newName;

            match = buffer.match(/^([a-z]+):/im);
        }

        data[name] = buffer;

        return fromFile(data, skip);

    } catch (e){
        if(e instanceof FileError)
            return null;

        throw e;
    }
}

//////////////////////////// File System Interface ///////////////////////////////

/** File System
 * 
 */
const fs = {

    /** Link to File or Directory
     * 
     * @param {string} from 
     * @param {string} to 
     * @param {LinkOptions} opts 
     */
    async link(from:string, to:string, opts:LinkOptions = {}):Promise<void> {
        await db.createLink(from, to, {
            ...opts,
            user: await User.id()
        });
    },

    /** Unlink File or Directory
     * 
     * Will delete file or directoy if base location is chosen
     * 
     * @param {string} path 
     * @param {UnlinkOptions} opts 
     */
    async unlink(path:string, opts:UnlinkOptions = {}):Promise<void> {
        db.unlink(path, {
            ...opts,
            user: await User.id()
        })
    },

    /** Remove File or Dirctory
     * 
     * @param {string} path 
     * @param {RemoveOptions} opts 
     */
    async rm(path:string, opts:RemoveOptions = {}):Promise<void> {
        const test = await db.remove(path, {
            ...opts,
            user: await User.id()
        });
    
        if(test && test.length > 0) {
            const e = new Error("Return list not empty!")
            e.name = "Critical Error";
            throw e;
        }
    },

    /** Get Stats
     * 
     * @param {string} path 
     * @returns {Promise<SystemStats|null>}
     */
    async stats(path:string):Promise<SystemStats|null> {
        const info  = await db.getInfo(path);
        const about = Path.parse(path);
    
        if(info === undefined)
            return null;
    
        (info as db.FileDirectoryData)
    
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
        return db.getSize(path);
    },

    /** File or Directory Exists
     * 
     * @param {string} path 
     * @returns {Promise<boolean>}
     */
    async exists(path:string):Promise<boolean>{
        return (await db.getInfo(path)) !== undefined;
    },

    /** Move Directory or File
     * 
     * @param {string} from 
     * @param {string} to 
     */
    async move(from:string, to:string):Promise<void> {
        throw new Error("Move is not yet implemented!");
    },

    /** Copy Directory or File
     * 
     * @param {string} from 
     * @param {string} to 
     */
    async copy(from:string, to:string):Promise<void> {
        throw new Error("Copy is not yet implemented!");
    },

    /** Rename Directory or File
     * 
     * @param {string} from 
     * @param {string} to 
     */
    async rename(from:string, to:string):Promise<void> {
        throw new Error("Rename is not yet implemented!");
    },

    /** Change Mode
     * 
     * @param {string} path 
     */
    async chmod(path:string, value:number){
        throw new Error("Change Mode is not yet implemented!")
    },

    /** Make Directory
     * 
     * @param {string} path 
     * @param {MakeDirectoryOptions} opts 
     */
    async mkdir(path:string, opts:MakeDirectoryOptions = {}):Promise<void> {
        db.createDirectory(path, {
            ...opts,
            user: await User.id()
        })
    },

    /** Read Directory
     * 
     * @param {string} path 
     * @returns {Promise<string[]>}
     */
    async readdir(path:string):Promise<string[]> {
        return await db.readDirectory(path, await User.id())
    },

    /** Make File
     * 
     */
    async mkfile(path:string, opts:MakeDirectoryOptions = {}, data?:string):Promise<void> {
        await db.createFile(path, {
            ...opts,
            user: await User.id()
        }, data);
    },

    /** Write File
     * 
     * @param {string} path 
     * @param {string} data 
     * @param {WriteFileOptions} opts 
     */
    async writefile(path:string, data:string, opts:WriteFileOptions = {}):Promise<void> {
        if(await this.exists(path)) {
            await db.writeToFile(path, {
                user: await User.id(),
                type: opts.type || "Override"
            }, data);

        } else if(opts.force){
            await db.createFile(path, {
                recursive: true,
                user: await User.id()
            }, data);
        }
        
    },

    /** Read File
     * 
     * @param {string} path 
     * @returns {Promise<string>}
     */
    async readfile(path:string):Promise<string> {
        return await db.readFile(path, await User.id());
    },

    /** Open File
     * 
     * @param {string} path 
     * @returns {Promise<stream>}
     */
    openfile(path:string):Promise<Stream>{ 
        throw new Error("Open File is not yet implemented!")
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
