/** /System/Stream/IO
 * 
 * @author Alex Malotky
 */
import {ReadStream, WriteStream, BufferReference} from "../Stream";
import { writeToFile, createFile, readFile } from "../Files/Database";
import { assertReady } from "../Files";
import { ROOT_USER_ID } from "../User";
import { sleep } from "..";

//File Locations
const STDIN_FILE = "/sys/stdin";
const STDOUT_FILE = "/sys/stdout";

//IO Values
let input:string = "";
let output:string = "";
let ready:boolean = false;

//Load values from the System
assertReady("readwrite").then(async(ref)=>{
    const tx = await ref.open();
    try {
        await createFile(STDIN_FILE, {recursive: true, soft: true, user: ROOT_USER_ID}, tx);
        await createFile(STDOUT_FILE, {recursive: true, soft: true, user: ROOT_USER_ID}, tx);
        ready = true;
        const start = await readFile(STDOUT_FILE, ROOT_USER_ID, tx as any);
        if(start)
            OutputBuffer.value = start + output;
    } catch (e){
        console.error(e)
    }  finally {
        ref.close();
    }
}).catch(console.error);

/** Save Helper Function
 * 
 */
async function save(file:string, value:string) {
    while(!ready)
        await sleep();
    const ref = await assertReady("readwrite");
    await writeToFile(file, {user:ROOT_USER_ID, type: "Rewrite"}, value, await ref.open());
    ref.close();
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
export const OutputBuffer:BufferReference = {
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