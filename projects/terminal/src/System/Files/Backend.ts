/** /System/Files/Backend
 * 
 * Include functions and types for other System level processes to easily
 * access the file system.
 * 
 * @author Alex Malotky
 */
import * as Path from "./Path";
import * as FsDb from "./Database";
import Queue, {FilestoreInitData, initFilestoreDatabase, FilestoreTransaction} from "./Database/TransactionQueue";
import FileConnection from "./Database/Connection";
import { executable, createFile } from "./Database";
import {FileData, DirectoryData} from "./Database/Schema"
import {Process} from "..";
import { fromFile, toFile } from "../Script";
import { FileError } from "./Errors";
import User, { UserId } from "../User";
import { join } from "./Path";
import { encodeValue } from "./Encoding";

export {Queue, initFilestoreDatabase, FsDb, FileConnection};
export type {FilestoreInitData, FilestoreTransaction, FileData, DirectoryData};

export function parseExecutable(buffer:string, name?:string, skip?:boolean):Process {
    if(skip === undefined)
        skip = name === undefined;

    const data:Record<string, string> =  {name: name!};
    let match:RegExpMatchArray|null = buffer.match(/^([a-z]+):/im);
    let n:string = "*";

    while(match !== null) {
        const index = buffer.indexOf(match[0]);
        const newName = match[1].toLocaleLowerCase();
        const value = buffer.substring(0, index);
        buffer = buffer.substring(index+match[0].length);

        data[n.toLocaleLowerCase().trim()] = value;
        name = newName;

        match = buffer.match(/^([a-z]+):/im);
    }

    data[n] = buffer

    return fromFile(data, skip);
}

export async function execute(file:string, skip?:boolean):Promise<Process|null> {
    file = await Path.format(file);
    const {base} = Path.parse(file);
    const ref = Queue("readonly");
    try {
        return parseExecutable(await executable(file, await User.id(), await ref.open()), base, skip);
    } catch (e){
        if(e instanceof FileError)
            return null;

        throw e;
    } finally {
        ref.close();
    }
}

interface WritingExecutableOptions {
    user?: UserId
    mode?: number
    force?: boolean
    soft?: boolean
}

export async function writeExecutable(path:string, process:Process, opts:WritingExecutableOptions = {}):Promise<void> {
    const {user = await User.id(), mode, force:recursive, soft} = opts;
    const [name, data] = toFile(process);
    path = join(path, name);

    let buffer:string;
    if(data["*"]) {
        buffer = data["*"];
    } else {
        buffer = "";
        if(data["description"])
            buffer += "description: "+data["description"]+"\n";

        if(data["history"])
            buffer += "history: "+data["history"]+"\n";
        
        if(data["help"])
            buffer += "help:\n"+data["help"]+"\n";

        buffer += "main:\n"+data["main"];
    }

    const ref = Queue("readwrite");
    await createFile(path, {user, mode, recursive, soft}, await ref.open(), encodeValue(buffer));
    ref.close();
}