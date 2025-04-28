import * as db from "./Database";
import { normalize, parse } from "./Path";

function getCurrentUser(): number {
    return 0;
}

function getUserName(id:number):string {
    return "Unknown";
}

export interface LinkOptions {
    mode?:number
}

export async function link(from:string, to:string, opts:LinkOptions = {}):Promise<void> {
    db.createLink(from, to, {
        ...opts,
        user: getCurrentUser()
    });
}

export interface UnlinkOptions {
    force?:boolean
    recursive?:boolean
}

export async function unlink(path:string, opts:UnlinkOptions = {}):Promise<void> {
    db.unlink(path, {
        ...opts,
        user: getCurrentUser()
    })
}

export interface MakeDirectoryOptions {
    recursive?: boolean
    chmod?: number
}

export async function mkdir(path:string, opts:MakeDirectoryOptions = {}):Promise<void> {
    db.createDirectory(path, {
        ...opts,
        user: getCurrentUser()
    })
}

export async function move(from:string, to:string):Promise<void> {
    throw new Error("Move is not yet implemented!");
}

export async function copy(from:string, to:string):Promise<void> {
    throw new Error("Copy is not yet implemented!");
}

export async function rename(from:string, to:string):Promise<void> {
    throw new Error("Rename is not yet implemented!");
}

export async function readdir(path:string):Promise<string[]> {
    return db.readDirectory(path, getCurrentUser())
}

export interface RemoveOptions {
    recursive?:boolean
}

export async function rm(path:string, opts:RemoveOptions = {}):Promise<void> {
    const test = await db.remove(path, {
        ...opts,
        user: getCurrentUser()
    });

    if(test && test.length > 0) {
        const e = new Error("Return list not empty!")
        e.name = "Critical Error";
        throw e;
    }
}

export async function readfile(path:string):Promise<string> {
    return await db.readFile(path, getCurrentUser());
}

export interface WriteFileOptions {
    type?: db.WriteFileType
}

export async function writefile(path:string, content:string, opts:WriteFileOptions = {}):Promise<void> {
    await db.writeToFile(path, {
        user: getCurrentUser(),
        type: opts.type || "Override"
    }, content) 
}

export async function openfile(path:string){ //Stream?
    throw new Error("Open File is not yet implemented!")
}

export async function exists(path:string):Promise<boolean>{
    return (await db.getInfo(path)) !== undefined;
}

export async function chmod(path:string){
    throw new Error("Change Mode is not yet implemented!")
}


interface LinkedFileStat {
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
interface LinkedDirectoryStat {
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
type LinkSystemStats = LinkedFileStat|LinkedDirectoryStat;

interface FileSystemStats {
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
interface DirectorySystemStats {
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
interface BrokenLinkSystemStats {
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
type SystemStats = FileSystemStats|DirectorySystemStats|BrokenLinkSystemStats|LinkSystemStats

export async function stats(path:string):Promise<SystemStats|null> {
    const info  = await db.getInfo(path);
    const about = parse(path);

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
            owner: getUserName(info.owner),
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
        owner: getUserName(info.owner),
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
}

