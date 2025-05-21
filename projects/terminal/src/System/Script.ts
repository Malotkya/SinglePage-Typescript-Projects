/** /System/Script
 * 
 * @author Alex Malotky
 */
import {Process,  HelpFunction, MainFunction, validateCall, SYSTEM_ID } from ".";
import * as db from "./Kernel/Script"
import fs from "./File";
import Kernel, {Path} from "./Kernel";
import Arguments from "./Arguments";
import { FileError } from "./Kernel/Errors";

/** Async Function Constructor
 * 
 */
const AsyncFunction:typeof Function = Object.getPrototypeOf(async function(){}).constructor;

// Availble Scope Items
const ScriptScope = {
    Kernel: Kernel,
    fs: fs,
    path: Path,
    window: undefined,
    globalThis: undefined
};

/** Build Script Function
 * 
 * @param {string} data 
 * @returns {Function}
 */
function buildScript<T extends Function>(data:string):T {
    const script:Function = new AsyncFunction(`{${Object.keys(ScriptScope).join(",")}}`, "args", data);
    return (async(args:Arguments|undefined)=>{
        return script.bind(null, ScriptScope, args);
    }) as any;
}

/** From File
 * 
 * @param {Record<string, string>} data 
 * @returns {Process}
 */
function _fromFile(data:Record<string, string>, skipValidation?:boolean):Process {
    const history = data["history"]? data["history"].toLocaleLowerCase().trim(): "";
    const call = skipValidation? data["name"]: validateCall(data["name"]);
    const help = data["help"]? buildScript<HelpFunction>(data["help"]): undefined;
    const description:string|undefined = data["description"];
    const string:string|undefined = data["main"] || data["*"];
    
    if(typeof string !== "string")
        throw new Error("Main function missing");

    const main = buildScript<MainFunction>(string);
    
    return {
        call, description, main, help,
        history: history === "true" || history === "1",
    }
}


/** To File
 * 
 * @param {Process} script 
 * @returns {Record<string, string>}
 */
function _toFile(script:Process):[string, Record<string, string>] {
    const {call, history, main, help, description} = script;
    const output:Record<string, string> = {};
    let userStar = true;

    if(history) {
        output["history"] = "true";
        userStar = false;
    }
        

    if(description) {
        output["description"] = description;
        userStar = false;
    }

    if(help) {
        output["help"] = db.functionToString(help);
        userStar = false;
    }

    if(userStar)
        output["*"] = db.functionToString(main);
    else
        output["main"] = db.functionToString(main);

    return [call, output];
}

/** Load Scripts in Directory
 * 
 * @param {string} path 
 * @returns {Promise<Process[]>}
 */
export async function loadDirectory(path:string):Promise<Process[]>{
    return (await Promise.all(
        (await db.loadDirectory(path, SYSTEM_ID)).map(async(data)=>{
            return _fromFile(data)
    }))).flat();
}

/** Load Script from file.
 * 
 * @param {string} path 
 * @param {boolean} skip 
 * @returns {Promise<Process>}
 */
export async function loadScript(path:string, skip?:boolean):Promise<Process> {
    const data = await db.loadScript(path, SYSTEM_ID);
    return _fromFile(data, skip);
}

/** Write Script to File
 * 
 * @param {string} path 
 * @param {Process} process 
 * @param {Object} opts 
 */
export async function writeScript(path:string, process:Process, opts?:db.WritingExecutableOptions):Promise<void> {
    const [name, data] = _toFile(process);
    await db.writeScript(Path.join(path, name), data, opts);
}

/** Load Script Executable
 * 
 * @param {string} file 
 * @param {boolean} skip 
 * @returns {Promise<PRocess|null>}
 */
export async function execute(file:string, skip?:boolean):Promise<Process|null> {
    file = await Path.format(file);
    try {
        return loadScript(file, skip);
    } catch (e){
        if(e instanceof FileError)
            return null;

        throw e;
    }
}