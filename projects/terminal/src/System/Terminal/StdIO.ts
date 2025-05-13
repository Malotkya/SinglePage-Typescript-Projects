/** /System/Terminal/StdIO
 * 
 * @author Alex Malotky
 */
import {BufferReference} from "../Stream";
import {InputBuffer, OutputBuffer} from "../Stream/IO";
import { Queue, FsDb } from "../Files/Backend";
import { encodeValue } from "../Files/Encoding";
import { sleep } from "@";
import { SYSTEM_ID } from "..";
import { startingFiles } from "../Initalize";

//File Locations
const STDIN_FILE  = "/sys/stdin";
const STDOUT_FILE = "/sys/stdout";

//IO Values
let input:BufferReference<string> = {value: ""};
let output:BufferReference<string> = {value: ""};
const queueRef = Queue("readwrite");
let ready:boolean = false;

startingFiles(/*SYSTEM_ID*/"10", {
    "sys": {
        stdin: "",
        stdout: ""
    }
});

//Load values from the System
export async function initStdIO() {
    const tx = await queueRef.open();
    try {
        const start = new TextDecoder("utf-8").decode(await FsDb.readFile(STDOUT_FILE, SYSTEM_ID, tx as any));
        if(start)
            output.value = start + output.value;
    } catch (e){
        console.error(e)
    }  finally {
        queueRef.close();
        ready = true;
    }
};

/** Save Helper Function
 * 
 */
async function save(file:string, ref:BufferReference<string> ) {
    while(!ready)
        await sleep();
    await FsDb.writeToFile(file, {user:SYSTEM_ID, type: "Rewrite"}, encodeValue(ref.value), await queueRef.open());
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

