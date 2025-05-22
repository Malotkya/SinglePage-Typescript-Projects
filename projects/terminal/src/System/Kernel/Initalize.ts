/** /System/Kernel/Initalize
 * 
 * @author Alex Malotky
 */
import { FileData } from "./File/Schema";
import { FilestoreInitData } from "./File/TransactionQueue";
import { functionToString } from "./Script";
import { DEFAULT_FILE_MODE, DEFAULT_DRIECTORY_MODE } from "./Mode";
import { UserId } from "./User";

export interface Success<T> {
    type: "Success"
    value: T
}
export function Success():Success<undefined>
export function Success<T>(value:T):Success<T>
export function Success<T>(value?:T):Success<T> {
    return {
        type: "Success",
        value: value!
    }
}

export interface Failure<E extends Error> {
    type: "Failure",
    reason: E
}
export function Failure<E extends Error = Error>(reason:E):Failure<E>{
    return {
        type: "Failure",
        reason
    }
}

export type InitalizeResult<T, E extends Error = Error> = Success<T>|Failure<E>

export type File = string|FileData|Function;
export type Directory = {
    [name:string]: File|Directory|[number, Directory|File]
}

export type InitalizeIterator = {
    [Symbol.iterator]:()=>InitalizeIterator
    next:()=>InitalizeValue
}
export type InitalizeValue = {
    done?:boolean,
    value:[UserId, FilestoreInitData]
}

const fileMap:Record<string, Directory[]> = {};

export function startingFiles(user:UserId, dir:Directory) {
    const name = String(user);
    if(fileMap[name] === undefined)
        fileMap[name] = [];

    fileMap[name].push(dir);
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
                const map = fileMap[name];
                const value = map.shift() || {};
                while(map.length > 0)
                    merge(value, map.shift())
                
                return {value:[isNaN(Number(name))? null: name, convert(value)]}
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
export function convert(dir:Directory):FilestoreInitData {
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
 * @param {File|Directory|Array} value 
 * @returns {[number, File|Directory]}
 */
function parse(value:File|Directory|[number, File|Directory]):[number, File|Directory] {
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
 * @param {File|Directory|Array} value 
 * @returns {[number|undefined, File|Directory]}
 */
function optionalParse(value:File|Directory|[number, File|Directory]):[number|undefined, File|Directory] {
    if(Array.isArray(value))
        return value;

    return [undefined, value];
}

/** Optional Join
 * 
 * Inverse of the above optional Parse
 * 
 * @param {number|undefined} mode 
 * @param {File|Directory} value 
 * @returns {File|Directory|Array}
 */
function optionalJoin(mode:number|undefined, value:File|Directory):File|Directory|[number, File|Directory] {
    if(mode)
        return [mode, value];

    return value;
}

/** Extract Only SystemFile/Directory
 * 
 * @param {File|Directory|Array} value 
 * @returns {File|Directory}
 */
export function extract(value:File|Directory|[number, File|Directory]):File|Directory {
    if(Array.isArray(value))
        return value[1];

    return value;
}

/** Merge Inital Files
 * 
 * @param {Directory} original 
 * @param {Directory} additional 
 */
export function merge(original:Directory, additional?:Directory):void{
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
 * @param {File|Directory} required 
 * @param {File|Directory} optional 
 * @returns {File|Directory}
 */
function compare(required:Directory|File, optional?:Directory|File):Directory|File {
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