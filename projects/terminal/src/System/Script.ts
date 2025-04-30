/** /System/Script
 * 
 * @author Alex Malotky
 */
import System, {Process, validateCall, MainFunction, HelpFunction} from ".";
import History from "./History";
import fs from "./Files";
import * as Path from "./Files/Path";
import Arguments from "./Arguments";

/** Async Function Constructor
 * 
 */
const AsyncFunction:typeof Function = Object.getPrototypeOf(async function(){}).constructor;

// Availble Scope Items
function ScriptScope() {
    return {
        System: System,
        fs: fs,
        path: Path,
        window: undefined,
        globalThis: undefined
    }
}

export function functionToString(fun:Function):string {
    const value = (""+fun).replaceAll(/\s+/g, " ");

    let match = value.match(/^.*?{(.*)}.*?$/);
    if(match)
        return match[1];

    match = value.match(/^.*?=>(.*?)$/);
    if(match)
        return match[1];

    return value;
}

/** Build Script Function
 * 
 * @param {string} data 
 * @returns {Function}
 */
function buildScript<T extends Function>(data:string):T {
    const scope = ScriptScope();
    const script:Function = new AsyncFunction(`{${Object.keys(scope).join(",")}}`, "args", data);
    return (async(args:Arguments|undefined)=>{
        return script.bind(null, scope, args);
    }) as any;
}

/** From File
 * 
 * @param {Record<string, string>} data 
 * @returns {Process}
 */
export function fromFile(data:Record<string, string>, skipValidation?:boolean):Process {
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
        history: history === "true" || history === "1"? new History(call): undefined,
    }
}

