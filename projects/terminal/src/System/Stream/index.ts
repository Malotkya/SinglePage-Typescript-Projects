/** /System/Stream
 * 
 * @author Alex Malotky
 */
import Position, { comparePositions } from "../Terminal/Position";
import { HighlighMap } from "../Terminal/Bios";

export {InputStream, OutputStream} from "./IO";

/** Basic Stream Interface
 * 
 */
export default interface Stream {
    flush(i?:number):string
    readonly buffer:string
}

/** System Stream Interface
 * 
 * Requirements for the system to interact with the stream
 */
export interface SystemStream extends Stream {
    set(c:any):void
    pull(m:HighlighMap, p:Position, w:number):string
}

/** Read Stream 
 * 
 */
export interface ReadStream extends Stream {
    get(pattern?:string|RegExp):Promise<string>
    getln():Promise<string>
    next():Promise<string>
}

/** Write Stream
 * 
 */
export interface WriteStream extends Stream {
    write(c:any):void
}

/** Get Highlighted Helper Function
 * 
 * @param {string} buffer 
 * @param {HighlighMap} map 
 * @param {Position} pos 
 * @param {number} width 
 * @returns {string}
 */
export function getHighlighted(buffer:string, map:HighlighMap, pos:Position, width:number):string {
    const [start, end] = map;
    let output:string = "";

    for(let i=0; i<buffer.length; i++){
        const char = buffer.charAt(i);

        if(comparePositions(pos, start) >= 0 && comparePositions(pos, end) <= 0)
            output += char;

        if(char == '\n' || char == '\r') {
            pos.x = 0;
            pos.y++;
        } else {
            pos.x++;
            if(pos.x > width) {
                pos.x = 0;
                pos.y++;
            }
        }
    }

    return output;
}