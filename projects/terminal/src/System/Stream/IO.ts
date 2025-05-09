/** /System/Stream/IO
 * 
 * @author Alex Malotky
 */
import {ReadStream, WriteStream} from "../Stream";
import { Queue, FsDb } from "../Files/Backend";
import { ROOT_USER_ID } from "../User";
import { encodeValue } from "../Files/Encoding";
import { sleep } from "@";

//File Locations
const STDIN_FILE = "/sys/stdin";
const STDOUT_FILE = "/sys/stdout";

//IO Values
let input:string = "";
let output:string = "";
let ready:boolean = false;

//Load values from the System
const queueRef = Queue("readwrite");
queueRef.open().then(async(tx)=>{
    try {
        await FsDb.createFile(STDIN_FILE, {recursive: true, soft: true, user: ROOT_USER_ID}, tx);
        await FsDb.createFile(STDOUT_FILE, {recursive: true, soft: true, user: ROOT_USER_ID}, tx);
        ready = true;
        const start = new TextDecoder("utf-8").decode(await FsDb.readFile(STDOUT_FILE, ROOT_USER_ID, tx as any));
        if(start)
            OutputBuffer.value = start + output;
    } catch (e){
        console.error(e)
    }  finally {
        queueRef.close();
    }
}).catch(e=>{
    console.warn(e);
    queueRef.close();
});

/** Save Helper Function
 * 
 */
async function save(file:string, value:string) {
    while(!ready)
        await sleep();
    await FsDb.writeToFile(file, {user:ROOT_USER_ID, type: "Rewrite"}, encodeValue(value), await queueRef.open());
    queueRef.close();
}

//Cursor private value
let cursor:number = 0;
//stdin Buffer
export const InputBuffer = {
    hide: false,

    /** Add at Cursor
     * 
     * @param {string} c 
     */
    add(c:string){
        input = input.substring(0, cursor) 
            + c + input.substring(++cursor);
        save(STDIN_FILE, input);
    },

    /** Delete at Cursor
     * 
     */
    delete() {
        if(cursor < 0 || cursor > input.length)
            return;
    
        if(input.length > 0){
            if(cursor === 0){
                input = input.substring(1);
            } else {
                input = input.substring(0, cursor) + input.substring(cursor+1);
            }
        }
    },

    get value() {
        return input;
    },

    set value(v:string) {
        input = v;
        cursor = v.length;
        save(STDIN_FILE, input);
    },

    set cursor(value:number){
        cursor = value;
    },

    get cursor():number {
        if(cursor < 0)
            return 0;
        else if(cursor > input.length)
            return input.length;
        return cursor;
    }
}
/** Input Stream
 * 
 * Wrapper around stdin Buffer
 */
export class InputStream extends ReadStream {
    constructor() {
        super(InputBuffer);
    }

    flush() {
        this._ref.value = "";
        this._pos = 0;
        cursor = 0;
    }

    set hide(v:boolean){
        InputBuffer.hide = v;
    }

    get hide():boolean {
        return InputBuffer.hide
    }
}

//stdout Buffer
export const OutputBuffer = {
    get value(){
        return output;
    },
    set value(v:string){
        output = v;
        save(STDOUT_FILE, output);
    }
};
/** Output Stream
 * 
 * Wrapper around stdout Buffer
 */
export class OutputStream extends WriteStream {
    constructor(){
        super(OutputBuffer);
    }

    clear(){
        this._ref.value = "";
    }
}