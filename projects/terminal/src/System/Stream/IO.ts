/** /System/Stream/IO
 * 
 * @author Alex Malotky
 */
import {ReadStream, WriteStream, BufferReference} from "../Stream";
import { writeToFile, createFile, readFile } from "../Files/Database";
import { ROOT_USER_ID } from "../User";
import Database from "../Database";


//File Locations
const STDIN_FILE = "/sys/stdin";
const STDOUT_FILE = "/sys/stdout";

//IO Values
let input:string = "";
let output:string = "";

//Load values from the System
const ref = Database("FileSystem", "readwrite");
ref.open().then(async(tx)=>{
    try {
        await createFile(STDIN_FILE, {recursive: true, soft: true, user: ROOT_USER_ID}, tx);
        await createFile(STDOUT_FILE, {recursive: true, soft: true, user: ROOT_USER_ID}, tx);
        output = await readFile(STDOUT_FILE, ROOT_USER_ID, tx as any);
    } catch (e){
        console.error(e)
    }  finally {
        ref.close();
    }
}).catch(e=>{
    console.error(e);
    ref.close();
})

/** Save Helper Function
 * 
 */
async function save(file:string, value:string) {
    const ref = Database("FileSystem", "readwrite");
    await writeToFile(file, {user:ROOT_USER_ID, type: "Rewrite"}, value, await ref.open());
    ref.close();
}

//Cursor private value
let cursor:number = 0;
//stdin Buffer
export const InputBuffer = {

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