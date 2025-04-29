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