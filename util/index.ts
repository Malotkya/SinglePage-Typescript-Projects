/** @
 * 
 * Util Folder for Simple Typescirpt Apps
 * 
 * @author Alex Malotky
 */
import Color from "./Color";

/** Sleep
 * 
 * Await sleep n microsceconds
 * 
 * @param {number} n
 * @returns {Prmoise<void>}
 */
export function sleep(n:number = 1):Promise<void> {
    return new Promise((res)=>window.setTimeout(res, n));
}

/** Get Number Or Default
 * 
 * @param {unknown} value 
 * @param {number} d 
 * @returns {number}
 */
export function NumberOr(value:unknown, d:number):number {
    switch(value){
        case "":
        case undefined:
        case null:
            return d;

        default:
            const n = Number(value);

            if(isNaN(n))
                return d;

            return n;
    }
}

/** Get Color Or Default
 * 
 * @param {unknown} value 
 * @param {Color} d 
 * @returns {Color}
 */
export function ColorOr(value:unknown, d:Color):Color {
    try {
        return Color.from(String(value));
    } catch(e){
        return d;
    }
}

/** Better To String
 * 
 * @param {any} value 
 * @returns {string}
 */
export function betterToString(value:any):string {
    const type = typeof value;
    if(type === "string")
        return value;

    if(typeof value.toString === "function")
        return value.toString();

    if(type === "object")
        return JSON.stringify(value);

    return String(value);
}

export function regexSplit(value:string, seperator:RegExp):string[]{
    const output:string[] = [];
    let quotes:string|null = null;
    let current:string = "";
    let escaped:boolean = false;

    for(const char of value){
        if(escaped) {
            current += unescape(char);
            escaped = false;
            continue;
        }

        switch(char){
            case "'":
                if(quotes === "single") {
                    quotes = null;
                } else if(quotes === null){
                    quotes = "single";
                }
                current += char;
                break;

            case '"':
                if(quotes === "double") {
                    quotes = null;
                } else if(quotes === null){
                    quotes = "double";
                }
                current += char;
                break;
                
            case "`":
                if(quotes === "back") {
                    quotes = null;
                } else if(quotes === null){
                    quotes = "back";
                }
                current += char;
                break;

            case "\\":
                escaped = true;
                break;

            default:
                if(quotes) {
                    current += char
                } else {
                    if(char.match(seperator) && current) {
                        output.push(current);
                        current = "";
                    } else {
                        current += char
                    }
                } 
        }
    } //End For

    if(current){
        output.push(current);
    }

    return output;
}