/** /System/Stream/IO
 * 
 * @author Alex Malotky
 */
import {ReadStream, WriteStream, BufferReference} from "../Stream";

let cursor:number = 0;
let value:string = "";
export const InputBuffer = {
    add(c:string){
        value = value.substring(0, cursor) 
            + c + value.substring(++cursor);
    },

    delete() {
        if(cursor < 0 || cursor > value.length)
            return;
    
        if(value.length > 0){
            if(cursor === 0){
                value = value.substring(1);
            } else {
                value = value.substring(0, cursor) + value.substring(cursor+1);
            }
        }
    },

    get value() {
        return value;
    },

    set value(v:string) {
        value = v;
        cursor = v.length;
    },

    set cursor(value:number){
        cursor = value;
    },

    get cursor():number {
        if(cursor < 0)
            return 0;
        else if(cursor > value.length)
            return value.length;
        return cursor;
    }
}
export class InputStream extends ReadStream {
    private _h:boolean;

    constructor() {
        super(InputBuffer);
        this._h = false;
    }

    flush() {
        this._ref.value = "";
        this._pos = 0;
        cursor = 0;
    }

    set hide(v:boolean){
        this._h = v;
    }

    get hide():boolean {
        return this._h
    }

    get buffer(){
        if(this._h)
            return "";
        return super.buffer;
    }
}


export const OutputBuffer:BufferReference = {value:""};
export class OutputStream extends WriteStream {
    constructor(){
        super(OutputBuffer);
    }
}