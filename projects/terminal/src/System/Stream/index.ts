/** /System/Stream
 * 
 * @author Alex Malotky
 */
import Position, { comparePositions } from "../Terminal/Position";
import { HighlighMap } from "../Terminal/Bios";
import { betterToString, sleep } from "@";

export interface BufferReference {value:string}

/** Base Stream Class
 * 
 */
export default class Stream {
    protected _ref:BufferReference;
    protected _pos:number;

    constructor(buffer:BufferReference){
        this._ref = buffer;
        this._pos = 0;
    }

    flush(){
        this._pos = this.buffer.length;
    }

    get buffer():string {
        return this._ref.value;
    }
}

/** Read Stream
 * 
 */
export class ReadStream extends Stream {

    constructor(ref:BufferReference) {
        super(ref);
    }

    get buffer():string {
        return this._ref.value.substring(this._pos);
    }

    async get(pattern?:string|RegExp):Promise<string> {
        //Convert String Pattern into Regex capture everything before.
        if(typeof pattern === "string")
            pattern = new RegExp(`^(.*?)${pattern}`);

        while(true) {
            const {value, pos} = getNext(this.buffer, 0, pattern);

            if(value){
                this._pos += pos;
                return value;
            }

            await sleep();
        }
    }

    next():Promise<string> {
        return this.get(/^(.*?)\s+/);
    }

    getln(): Promise<string>{
        return this.get(/^(.*?)[\n\r]+/);
    }
}

/** Write Stream
 * 
 */
export class WriteStream extends Stream {

    constructor(ref:BufferReference) {
        super(ref);
    }

    write(chunk:any):void {
        const s = betterToString(chunk);
        this._ref.value += s
        this._pos += s.length;
    }
}

/** Get Highlighted Helper Function
 * 
 * @param {string} buffer 
 * @param {HighlighMap} map 
 * @param {Position} pos 
 * @param {number} width 
 * @returns {string}
 */
export function getHighlightedFromBuffer(buffer:string, map:HighlighMap, pos:Position, width:number):string {
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

/** Get Next Helper
 * 
 * @param {string} buffer 
 * @param {number} pos 
 * @param {RegExp} regex 
 * @returns {Object}
 */
export function getNext(buffer:string, pos:number, regex?:RegExp):{value:string|null, pos:number} {
    if(regex === undefined){
        if(buffer.length < 0)
            return {value:null, pos:Number.NaN};

        return {
            value: buffer.charAt(0),
            pos: pos+1
        }
    }

    const match = buffer.match(regex);
    if(match === null)
        return {value:null, pos:Number.NaN};

    pos += buffer.indexOf(match[0]) + match[0].length;

    if(typeof match[1] === "string")
        return {
            value: match[1],
            pos
        }

    return {
        value: match[0],
        pos
    }
}