/** /System/Files/Path
 * 
 * Ment to emulate node:path as best as possible.
 * 
 * @author Alex Malotky
 */
import User from "../User";
import { currentLocation } from ".";

export const SEP = "/";
interface PathInfo {
    root: string,
    path: string,
    dir: string,
    base: string,
    name: string,
    ext: string
}

////////////////// Private Functions /////////////////////////

/** Assert Path
 * 
 * @param {string} path 
 * @param {string} name 
 */
function assertPath(path:string, name:string = "Path"):void {
    if(typeof path !== "string")
        throw new TypeError(`${name} must be a string!`);
}

/** Private Normalize Path
 * 
 * Used to normalize path before functions
 * 
 * @param {string} path 
 * @returns {string[]}
 */
function _normalize(path:string):string[] {    
    const list = path.split(SEP);
    
    let i = 0;
    while(i < list.length){
        switch(list[i]){
            case ".":
            case "":
            case undefined:
                list.splice(i, 1);
                break;

            case "..":
                if(i < 1)
                    list.splice(i, 2);
                else
                list.splice(i-1, 2);
                break;

            default:
                i++;
        }
    }

    return list;
}

/** Format Path to String
 * 
 * @param {string[]} path 
 * @returns {string}
 */
function _format(path:string[]):string {
    return SEP+path.filter(s=>s).join(SEP);
}

/** Private Relative Path
 * 
 * @param {string[]} from 
 * @param {string[]} to 
 * @returns {string[]|string}
 */
function _relative(from:string[], to:string[]):string[]|string {
    if(_pathsEqual(from, to))
        return ".";

    const length = Math.max(from.length, to.length);
    let i=0;
    let last:number = -1;
    while(i <= length){
        if(i === length){
            if(to.length > length){
                return to.slice(i+1)
            } else if(from.length > length) {
                last = i;
            }
            
            break;
        } // End If

        if(from[i] === to[i])
            last = i;

        ++i;
    }

    const output:string[] = [];
    for(i = last; i<=from.length; ++i){
        output.push("..")
    }

    if(output.length > 0) {
        return output.concat(to.slice(last));
    }

    return to.slice(last);
}

/** Paths Equal
 * 
 * @param {string[]} lhs 
 * @param {string[]} rhs 
 * @returns {boolean}
 */
function _pathsEqual(lhs:string[], rhs:string[]):boolean {
    if(lhs.length !== rhs.length)
        return false;

    for(let i=0; i<lhs.length; i++){
        if(lhs[i] !== rhs[i])
            return false;
    }

    return true;
}

/////////////////// Public Functions /////////////////////////

/** Relative Path
 * 
 * @param {string} from 
 * @param {string} to 
 * @returns {string}
 */
export function relative(from:string, to:string):string {
    assertPath(from, "From");
    assertPath(to, "To");

    if(from === to)
        return to;

    if(to[0] === "~")
        return to;

    const path = _relative(_normalize(from), _normalize(to));
    if(typeof path === "string")
        return path;

    return _format(path);
}

export async function format(value:string):Promise<string> {
    assertPath(value);

    if(value[0] === "~") {
        return await User.home() + value.substring(1);
    } else if(value[0] === ".") {
        return currentLocation() + value.substring(1);
    }

    return value;
}

/** Normalize Path
 * 
 * Removes Empty, ".", and ".." while fixing path structure.
 * 
 * @param {string} args 
 * @returns {string}
 */
export function normalize(...args:string[]):string {
    let string:string;
    if(args.length === 1) {
        string = args[0];
        assertPath(string);
    } else {
        string = join(...args);
    }

    return _format(_normalize(string));
}

/** Join Paths
 * 
 * @param {string[]} args 
 * @returns {string}
 */
export function join(...args:string[]):string {
    if(args.length === 0)
        throw new TypeError("Path must be a string!");

    let start:string;
    switch(args[0]) {
        case ".":
        case "~":
            start = args[0]+SEP;
            args.shift();
            break;

        case SEP:
        default:
            start = SEP;
    }

    return start+args.flatMap(s=>s.split(SEP))
        .filter(s=>s).join(SEP);
}

/** Is Immediate Parrent
 * 
 * @param {string} parrent 
 * @param {string} child 
 */
export function parrent(parrent:string, child:string):boolean {
    assertPath(parrent);
    assertPath(child);

    const lhs = _normalize(parrent);
    const rhs = _normalize(child);

    if(rhs.length === 0){
        return false
    } else {
        rhs.pop();
    }

    return _pathsEqual(lhs, rhs);
}

/** Parse Info
 * 
 * @param {string} path 
 * @returns {PathInfo}
 */
export function parse(path:string):PathInfo{
    assertPath(path);

    const ext = extension(path);
    const base = dirname(path);

    let name:string = base;
    if(ext) {
        const index = name.lastIndexOf(ext);
        if(index > 0 && index+ext.length >= name.length){
            name = name.slice(-ext.length);
        }
    }

    return {
        root: "/",
        path: normalize(path, ".."),
        dir: _format(_normalize(path)),
        ext, base, name
    }
}

/** Path Filename
 * 
 * @param {string} path 
 * @param {string} suffix 
 * @returns {string}
 */
export function filename(path:string, suffix?:string):string {
    assertPath(path);

    let index = path.lastIndexOf(SEP);
    if(index < 0)
        return "";

    path = path.substring(index+1);

    if(suffix) {
        index = path.lastIndexOf(suffix);
        if(index > 0 && index+suffix.length >= path.length){
            path = path.slice(-suffix.length);
        }
    }

    return path;
}

/** File Extension
 * 
 * @param {string} path 
 * @returns {string}
 */
export function extension(path:string):string {
    assertPath(path);

    const index = path.lastIndexOf(".");
    if(index < 0)
        return "";

    return path.substring(index+1);
}

/** Path Directory Name
 * 
 * @param {string} path 
 * @returns {string}
 */
export function dirname(path:string):string {
    assertPath(path);

    if(path.length === 0)
        return ".";

    const index = path.lastIndexOf(SEP);
    if(index < 0)
        return path;

    return path.substring(index+1);
}
