/** /System/Stream
 * 
 * @author Alex Malotky
 */
import Position, { comparePositions } from "../Terminal/Position";
import { HighlighMap } from "../Terminal/Bios";
import { sleep } from "..";
import { betterToString } from "@";

export {InputStream, OutputStream} from "./IO";

export interface BufferReference {value:string}

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

export class ReadStream extends Stream {

    constructor(ref:BufferReference) {
        super(ref);
    }

    get buffer():string {
        return this._ref.value.substring(this._pos);
    }

    async get(pattern?:string|RegExp):Promise<string> {
        //Get Just First Char
        if(pattern === undefined){
            while(this.buffer.length < 0) {
                await sleep();
            }
                

            const char = this.buffer.charAt(0);
            this._pos += 1;
            return char;
        }

        //Convert String Pattern into Regex capture everything before.
        if(typeof pattern === "string")
            pattern = new RegExp(`^(.*?)${pattern}`);

        //Aquire Match
        while(true){
            const match = this.buffer.match(pattern);
            if(match){
                this._pos += this.buffer.indexOf(match[0]) + match[0].length;

                if(typeof match[1] === "string")
                    return match[1];

                return match[0];
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

export class WriteStream extends Stream {

    constructor(ref:BufferReference) {
        super(ref);
    }

    write(chunk:any) {
        this._ref.value += betterToString(chunk);
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