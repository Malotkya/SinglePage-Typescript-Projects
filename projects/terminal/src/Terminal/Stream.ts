/** /Terminal/Stream
 * 
 * Attempting to mimic streams to handle input and output of strings.
 * 
 * @author Alex Malotky
 */
import { sleep } from ".";
import Position, { comparePositions } from "./Position";
import { HighlighMap } from "./Bios";

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

/** Stream Interface
 * 
 * This class acts like a stream to handle inputs and outputs.
 */
export default interface Stream {
    add(c:any):void
    set(c:any):void
    flush(i?:number):string
    pull(m:HighlighMap, p:Position, w:number):string
    readonly buffer:string
}

export class InputStream implements Stream {
    private _print: string;
    private _buffer:string;

    public constructor(){
        this._buffer = "";
        this._print = "";
    }

    /** Set Buffer
     * 
     * @param {any} chunk 
     */
    public set(chunk: any){
        if(chunk) {
            this._print = String(chunk);
            this._buffer = String(chunk);
        }
    }

    /** Add Chunk to Buffer
     * 
     * @param {any} chunk 
     */
    public add(chunk: any){
        this._print += String(chunk);
        this._buffer += String(chunk);
    }

    /** Remove from Buffer
     * 
     * Implements Backspace
     */
    public remove(){
        this._buffer = this._buffer.slice(0, -1);
        this._print = this._print.slice(0, -1);
    }
    
    /** Get From Buffer
     * 
     * typeof pattern:
     *  undefiend => get next char
     *     string => return and remove string up to pattern + removes pattern
     *     RegExp => return and remove first match
     * 
     * @param {string|RegExp} pattern 
     * @returns {Promise<string>}
     */
    async get(pattern?:string|RegExp):Promise<string> {
        //Get Just First Char
        if(pattern === undefined){
            while(this._buffer.length < 1)
                await sleep();

            const char = this._buffer.charAt(0);
            this._buffer = this._buffer.substring(1);
            return char;
        }

        //Convert String Pattern into Regex capture everything before.
        if(typeof pattern === "string")
            pattern = new RegExp(`^(.*?)${pattern}`);

        //Aquire Match
        while(true){
            const match = this._buffer.match(pattern);
            if(match){
                this._buffer = this._buffer.replace(match[0], "");

                if(match[1])
                    return match[1];

                return match[0];
            }

            await sleep();
        }
    }

    /** Next Input
     * 
     * Equivalent to get(/^(.*?)\s+/)
     * 
     * @returns {Promise<string>}
     */
    next():Promise<string> {
        return this.get(/^(.*?)\s+/);
    }

    /** Get Line
     * 
     * Equivalent to get(/^(.*?)[\n\r]+/)
     * 
     * @returns {Promise<string>}
     */
    getln(): Promise<string>{
        return this.get(/^(.*?)[\n\r]+/);
    }

    pull(map:HighlighMap, pos:Position, width:number):string {
        return getHighlighted(this._print, map, pos, width);
    }

    public get buffer() {
        return this._print;
    }

    public clean() {
        this._print = "";
    }

    public flush(n:number = this._buffer.length){
        this._print = this._print.substring(n);
        return this._buffer.slice(n);
    }
}

const OUT_KEY = "OutputStream:Buffer";
export class OutputStream implements Stream {
    add(s:any){
        localStorage.setItem(OUT_KEY, this.buffer + String(s));
    }

    set(s:any){
        localStorage.setItem(OUT_KEY, String(s));
    }

    flush(n?:number) {
        let buffer = this.buffer;
        let output:string;
        if(n){
            output = buffer.slice(n);
        } else {
            output = buffer;
            buffer = "";
        }
        localStorage.setItem(OUT_KEY, buffer);
        return output;
    }

    pull(map:HighlighMap, pos:Position, width:number):string {
        return getHighlighted(this.buffer, map, pos, width);
    }

    get buffer(){
        return localStorage.getItem(OUT_KEY) || "";
    }

    get ready():boolean {
        return this.buffer.length > 0;
    }
}