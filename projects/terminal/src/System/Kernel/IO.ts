/** /System/Kernel/IO
 * 
 * @author Alex Malotky
 */
import {BufferReference} from "./Stream";
import {InputBuffer, OutputBuffer} from "./Stream/IO";
import Queue from "./File/TransactionQueue";
import * as FsDb from "./File";
import { encodeValue } from "./Encoding";
import { sleep } from "@";
import { Failure, InitalizeResult, startingFiles, Success } from "./Initalize";
import { ROOT_USER_ID } from "./User";
//File Locations
const STDIN_FILE  = "/sys/stdin";
const STDOUT_FILE = "/sys/stdout";

//IO Values
let input:BufferReference<string> = {value: ""};
let output:BufferReference<string> = {value: ""};
const queueRef = Queue("readwrite");
let ready:boolean = false;

startingFiles(ROOT_USER_ID, {
    "sys": {
        stdin: "",
        stdout: ""
    }
});

//Load values from the System
export async function initStdIO():Promise<InitalizeResult<undefined>>{
    const tx = await queueRef.open();
    try {
        const start = new TextDecoder("utf-8").decode(await FsDb.readFile(STDOUT_FILE, ROOT_USER_ID, tx as any));
        if(start)
            output.value = start + output.value;
    } catch (e:any){
        console.error(e);
        if( !(e instanceof Error) )
            e = new Error(String(e));

        return Failure(e);
    }  finally {
        queueRef.close();
        ready = true;
    }

    return Success();
};

/** Save Helper Function
 * 
 */
async function save(file:string, ref:BufferReference<string> ) {
    while(!ready)
        await sleep();
    await FsDb.writeToFile(file, {user:ROOT_USER_ID, type: "Rewrite"}, encodeValue(ref.value), await queueRef.open());
    queueRef.close();
}

/** Std Input Buffer
 * 
 * Input Buffer for stdin
 */
export class StdInputBuffer extends InputBuffer {
    constructor(){
        super(input);
    }

    set value(v:string){
        super.value = v;
        save(STDIN_FILE, input)
    }

    get value():string{
        return super.value;
    }
}

/** Std Output Buffer
 * 
 * Output Buffer for stdout
 */
export class StdOutputBuffer extends OutputBuffer {
    constructor(){
        super(output);
    }

    set value(v:string){
        super.value = v;
        save(STDOUT_FILE, output);
    }

    get value():string{
        return super.value;
    }
}

