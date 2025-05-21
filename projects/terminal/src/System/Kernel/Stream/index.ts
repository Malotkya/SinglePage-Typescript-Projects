/** /System/Kernel/Stream
 * 
 * @author Alex Malotky
 */
import { betterToString, sleep } from "@";
import Encoding from "../Encoding";

export interface Readable {
    get:{
        (char?:string|RegExp, empty?:boolean):Promise<string>
        ():Promise<string>
    }
    next:()=>Promise<string>
    getln:(empty?:boolean)=>Promise<string>
}

export interface Writeable {
    write:(chunk:any)=>void
}

export type BufferReference<T extends any> = T extends Encoding
    ? {value: Encoding}
    : T extends string
        ? {value: string}
        : {value: T[]}

export type BufferValue<T> = T extends Encoding
    ? Encoding
    : T extends string
        ? string
        : T[]

/** Base Stream Class
 * 
 */
export default class Stream<T> {
    protected _ref:BufferReference<T>;
    protected _pos:number;

    constructor(buffer:BufferReference<T>){
        this._ref = buffer;
        this._pos = 0;
    }

    flush(){
        this._pos = this.buffer.length;
    }

    get buffer():BufferValue<T> {
        return this._ref.value as any;
    }
}

/** Read Stream
 * 
 */
export class ReadStream extends Stream<string> implements Readable {

    constructor(ref:BufferReference<string>) {
        super(ref);
    }

    get buffer():string {
        return this._ref.value.substring(this._pos);
    }

    async get(pattern?:string|RegExp, empty?:boolean):Promise<string> {
        //Convert String Pattern into Regex capture everything before.
        if(typeof pattern === "string")
            pattern = new RegExp(`^(.*?)${pattern}`);

        while(true) {
            const {value, pos} = getNext(this.buffer, 0, pattern);

            if(!isNaN(pos))
                this._pos += pos;

            if(value || (value === "" && empty))
                return value;


            await sleep();
        }
    }

    next():Promise<string> {
        return this.get(/^(.*?)\s+/);
    }

    getln(empty?:boolean): Promise<string>{
        return this.get(/^(.*?)[\n\r]+/, empty);
    }
}

/** Write Stream
 * 
 */
export class WriteStream extends Stream<string> implements Writeable{

    constructor(ref:BufferReference<string>) {
        super(ref);
    }

    write(chunk:any):void {
        const s = betterToString(chunk);
        this._ref.value += s
        this._pos += s.length;
    }
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