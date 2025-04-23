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
    private _cursor:number;

    public constructor(){
        this._buffer = "";
        this._print = "";
        this._cursor = 0;
    }

    /** Set Buffer
     * 
     * @param {any} chunk 
     */
    public set(chunk: any){
        
        if(chunk) {
            chunk = String(chunk);
            const index = this._buffer.length - this._print.length;
            this._buffer = this._buffer.substring(0, index) + chunk
            this._print = chunk;
            this._cursor = chunk.length;
        }
    }

    /** Add Chunk to Buffer
     * 
     * @param {any} chunk 
     */
    public add(chunk: any){
        chunk = String(chunk);
        if(this._cursor === this._print.length || this._print.length === 0) {
            this._print += chunk;
            this._buffer += chunk;
        } else {
            const index = this._buffer.length - (this._print.length - this._cursor)

            this._print = this._print.substring(0, this._cursor) + chunk
                        + this._print.substring(this._cursor);
            
            this._buffer = this._buffer.substring(0, index) + chunk
                         + this._buffer.substring(index);
        }
        this.cursor += chunk.length;
    }

    public enter() {
        const output = this._print+"\n";
        this._buffer += "\n";
        this._print = "";
        this._cursor = 0;
        return output;
    }

    /** Backspace Implementation
     */
    public backspace(){
        this.remove(--this._cursor);
    }

    /** Delete Implementation
     * 
     */
    public delete(){
        this.remove(this._cursor);
    }

    /** Remove at Index
     * 
     * @param {number} index 
     */
    private remove(index:number) {
        if(index < 0 || index > this._print.length)
            return;

        if(this._print.length > 0){
            const bufferIndex = this._buffer.length - (this._print.length - index);

            if(index === 0){
                this._print = this._print.substring(1);
            } else {
                this._print = this._print.substring(0, index) + this._print.substring(index+1);
            }

            if(bufferIndex === 0){
                this._buffer = this.buffer.substring(1);
            } else {
                this._buffer = this._buffer.substring(0, index) + this._buffer.substring(index+1);
            }
            
        }
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

                if(typeof match[1] === "string")
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
        this._cursor = 0;
    }

    get cursor():number {
        return this._cursor;
    }

    set cursor(n:number) {
        if(n < 0)
            this._cursor = 0;
        else if(n > this._print.length)
            this._cursor = this._print.length;
        else
            this._cursor = n;
    }

    public flush(n:number = this._buffer.length){
        this._print = this._print.substring(n);
        this.cursor -= n;
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