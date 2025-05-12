/** /System/Initalize
 * 
 * @author Alex Malotky
 */
import { FilestoreInitData, FileData } from "../Files/Backend";
import { functionToString } from "../Script";
import { DEFAULT_FILE_MODE, DEFAULT_DRIECTORY_MODE } from "../Files/Mode";
import { UserId } from "../User";
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

const fileMap:Record<string, SystemDirectory> = {
    /*SYSTEM_ID*/"10": SystemDirectory
};

export function startingFiles(user:UserId, dir:SystemDirectory) {
    const name = String(user);
    if(fileMap[String(user)]) {
        merge(fileMap[name], dir);
    } else {
        fileMap[name] = dir;
    }
}

export function InitIterator():InitalizeIterator{
    const list = Object.keys(fileMap).sort((a, b)=>{
        let lhs = Number(a);
        let rhs = Number(b);

        if(isNaN(lhs))
            return 1;
        if(isNaN(rhs))
            return -1

        return lhs - rhs;
    });

    return {
        next() {
            const name = list.shift();
            if(name !== undefined){
                return {value:[isNaN(Number(name))? null: name, convert(fileMap[name])]}
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

/** Optional Parse
 * 
 * Works similar to above parse, but instead returns undefined mode instead of corsing the value.
 * 
 * @param {SystemFile|SystemDirectory|Array} value 
 * @returns {[number|undefined, SystemFile|SystemDirectory]}
 */
function optionalParse(value:SystemFile|SystemDirectory|[number, SystemFile|SystemDirectory]):[number|undefined, SystemFile|SystemDirectory] {
    if(Array.isArray(value))
        return value;

    return [undefined, value];
}

/** Optional Join
 * 
 * Inverse of the above optional Parse
 * 
 * @param {number|undefined} mode 
 * @param {SystemFile|SystemDirectory} value 
 * @returns {SystemFile|SystemDirectory|Array}
 */
function optionalJoin(mode:number|undefined, value:SystemFile|SystemDirectory):SystemFile|SystemDirectory|[number, SystemFile|SystemDirectory] {
    if(mode)
        return [mode, value];

    return value;
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
export function merge(original:SystemDirectory, additional?:SystemDirectory):void{
    if(additional === undefined)
        return;

    for(const name of new Set(Object.keys(original).concat(Object.keys(additional)))) {
        if(original[name]) {
            const [mode, value] = optionalParse(original[name]);
            original[name] = optionalJoin(mode, compare(value, extract(additional[name]) ));

        } else {
            const [mode, value] = optionalParse(original[name]);
            switch(typeof value){
                case "function":
                    original[name] = optionalJoin(mode, functionToString(value));
                    break;

                case "object":
                    if( !(value instanceof Uint8Array) ) {
                        original[name] = optionalJoin(mode, convert(value));
                        break;
                    }
                    

                default:
                    original[name] = optionalJoin(mode, value);
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
function compare(required:SystemDirectory|SystemFile, optional?:SystemDirectory|SystemFile):SystemDirectory|SystemFile {
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