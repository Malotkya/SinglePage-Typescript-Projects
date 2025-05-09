import { FilestoreInitData } from "./System/Files/Backend";
import { functionToString } from "./System/Script";
import { DEFAULT_FILE_MODE, DEFAULT_DRIECTORY_MODE } from "./System/Files/Mode";

export type SystemFile = string|Function;
export type SystemDirectory = {
    [name:string]: SystemFile|SystemDirectory|[number, SystemDirectory|SystemFile]
}

/** Compare Values
 * 
 * Returns Required Value, or combined values if Directories.
 * 
 * @param {SystemFile|SystemDirectory} required 
 * @param {SystemFile|SystemDirectory} optional 
 * @returns {SystemFile|SystemDirectory}
 */
function compare(required:SystemDirectory|SystemFile, optional?:SystemDirectory|SystemFile):string|FilestoreInitData {
    switch(typeof required){
        case "function":
            return functionToString(required);

        case "object":
            return merge(required, typeof optional === "object"? optional: undefined);

        case "string":
            return required;

        default:
            return String(required);
    }
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
 * @param {InitialFiles} required 
 * @param {InitialFiles} optional 
 * @returns {FSInitData}
 */
export function merge(required:SystemDirectory, optional:SystemDirectory = {}):FilestoreInitData {
    const output:FilestoreInitData = {};

    for(const name of new Set(Object.keys(required).concat(Object.keys(optional)))) {
        if(required[name]) {
            const [mode, value] = parse(required[name]);
            output[name] = [mode, compare(value, extract(optional[name]) )]
        } else {
            const [mode, value] = parse(optional[name]);
            output[name] = [mode, compare(value)];
        }
    }

    return output;
}

