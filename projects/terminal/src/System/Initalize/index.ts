/** /System/Initalize
 * 
 * @author Alex Malotky
 */
import { FilestoreInitData, FileData } from "../Files/Backend";
import { functionToString } from "../Script";
import { DEFAULT_FILE_MODE, DEFAULT_DRIECTORY_MODE, DEFAULT_ROOT_MODE } from "../Files/Mode";
import { ROOT_USER_ID, UserId } from "../User";
import { SYSTEM_ID } from "..";
import SystemDirectory from "./Files";

export type SystemFile = string|FileData|Function;
export type SystemDirectory = {
    [name:string]: SystemFile|SystemDirectory|[number, SystemDirectory|SystemFile]
}

export type InitalizeIterator = {
    [Symbol.iterator]:()=>InitalizeIterator
    next:()=>InitalizeValue
}
export type InitalizeValue = {
    done?:boolean,
    value:[UserId, FilestoreInitData]
}

const fileMap:Record<string, FilestoreInitData> = {
    ROOT_USER_ID: {"root": [DEFAULT_ROOT_MODE, {}]},
    SYSTEM_ID: convert(SystemDirectory)
};

export function startingFiles(user:UserId, dir:SystemDirectory) {
    const name = String(user);
    if(fileMap[String(user)]) {

    } else {
        fileMap[name] = convert(dir);
    }
}

export function InitIterator():InitalizeIterator{
    const list = Object.keys(fileMap).sort((a, b)=>{
        let lhs = Number(a);
        let rhs = Number(b);

        if(isNaN(lhs))
            return -1;
        if(isNaN(rhs))
            return 1

        return lhs - rhs;
    });

    console.debug(list);

    return {
        next() {
            const name = list.shift();
            if(name !== undefined){
                return {value:[isNaN(Number(name))? null: name, fileMap[name]]}
            }
            return {
                done: true,
                value: <any>[]
            }
        },
        [Symbol.iterator](){
            return this;
        }
    }
}

/** Merge Inital Files
 * 
 * @param {SystemDirectory} dir 
 * @returns {FSInitData}
 */
export function convert(dir:SystemDirectory):FilestoreInitData {
    const output:FilestoreInitData = {};

    for(const name in dir) {
        const [mode, value] = parse(dir[name]);
        switch (typeof value){
            case "function":
                output[name] = [mode, functionToString(value)];
                break;

            case "object":
                if( !(value instanceof Uint8Array) ) {
                    output[name] = [mode, convert(value)];
                    break;
                }

            default:
                output[name] = [mode, value];
        }
    }

    return output;
}

/** Parse Mode and SystemFile/Directory
 * 
 * @param {SystemFile|SystemDirectory|Array} value 
 * @returns {[number, SystemFile|SystemDirectory]}
 */
function parse(value:SystemFile|SystemDirectory|[number, SystemFile|SystemDirectory]):[number, SystemFile|SystemDirectory] {
    if(Array.isArray(value))
        return value;

    switch(typeof value) {
        case "function":
        case "string":
            return [DEFAULT_FILE_MODE, value];

        case "object":
            return [DEFAULT_DRIECTORY_MODE, value];

        default:
            return [Number.NaN, String(value)];
    }
}

/** Extract Only SystemFile/Directory
 * 
 * @param {SystemFile|SystemDirectory|Array} value 
 * @returns {SystemFile|SystemDirectory}
 */
export function extract(value:SystemFile|SystemDirectory|[number, SystemFile|SystemDirectory]):SystemFile|SystemDirectory {
    if(Array.isArray(value))
        return value[1];

    return value;
}

/** Merge Inital Files
 * 
 * @param {InitialFiles} original 
 * @param {InitialFiles} additional 
 */
export function merge(original:FilestoreInitData, additional?:SystemDirectory):void{
    if(additional === undefined)
        return;

    for(const name of new Set(Object.keys(original).concat(Object.keys(additional)))) {
        if(original[name]) {
            original[name][1] = compare(original[name][1], extract(additional[name]) );
        } else {
            const [mode, value] = parse(original[name]);
            switch(typeof value){
                case "function":
                    original[name] = [mode, functionToString(value)];
                    break;

                case "object":
                    if( !(value instanceof Uint8Array) ) {
                        original[name] = [mode, convert(value)];
                        break;
                    }
                    

                default:
                    original[name] = [mode, value];
            }
        }
    }
}

/** Compare Values
 * 
 * Returns Required Value, or combined values if Directories.
 * 
 * @param {SystemFile|SystemDirectory} required 
 * @param {SystemFile|SystemDirectory} optional 
 * @returns {SystemFile|SystemDirectory}
 */
function compare(required:string|FileData|FilestoreInitData, optional?:SystemDirectory|SystemFile):string|FileData|FilestoreInitData {
    switch(typeof required){
        case "function":
            return functionToString(required);

        case "object":
            if( !(required instanceof Uint8Array) && !(optional instanceof Uint8Array))
                merge(required, typeof optional === "object"? optional: undefined)

        case "string":
            return required;

        default:
            return String(required);
    }
}