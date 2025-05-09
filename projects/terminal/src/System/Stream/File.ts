/** /System/Stream/File
 * 
 */
import Stream, {getNext} from ".";
import { FsDb, FileConnection, FileData } from "../Files/Backend";
import { betterToString, sleep } from "@";
import Encoding from "../Files/Encoding";

/** File Stream
 * 
 */
export default class FileStream extends Stream<Encoding> {
    declare _ref:FileConnection;

    constructor(conn:FileConnection) {
        super(conn);
    }

    close(){
        this._ref.close();
    }
}

/** Write File Stream
 * 
 */
export class WriteFileStream extends FileStream {
    public mode:FsDb.WriteFileType;

    constructor(value:FileConnection, mode:FsDb.WriteFileType) {
        super(value);
        this.mode = mode;
        if(mode === "Append")
            this._pos = this._ref.value.length;
    }

    write(chunk:any): void {
        const s = betterToString(chunk);
        switch(this.mode){
            case "Prepend":
                this._pos = 0;

            case "Insert": {
                const buffer = this._ref.value.Text();
                this._ref.value = new Encoding(buffer.substring(0, this._pos) + s + buffer.substring(this._pos));
                this._pos += s.length;
                break;
            }
            
            case "Override": {
                const buffer = this._ref.value.Text();
                this._ref.value = new Encoding(buffer.substring(0, this._pos) + s
                                + buffer.substring(this._pos += s.length));
                break;
            }

            case "Rewrite":
                this._ref.value = new Encoding(s);
                this._pos = this._ref.value.length;
                break;

            case "Append":
            default: {
                const buffer = this._ref.value.Text() + s;
                this._ref.value = new Encoding(buffer);
                this._pos = this._ref.value.length;
            }
        }
    }
}

/** Read File Stream
 * 
 */
export class ReadFileStream extends FileStream {
    async get(pattern?:string|RegExp):Promise<string> {
        //Convert String Pattern into Regex capture everything before.
        if(typeof pattern === "string")
            pattern = new RegExp(`^(.*?)${pattern}`);

        while(true) {
            const {value, pos} = getNext(this.buffer.Text(), 0, pattern);

            if(value){
                this._pos += pos;
                return value;
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

    reset(){
        this._pos = 0;
    }

    onUpdate(listener:()=>any){
        this._ref.onUpdate(listener);
    }
}

/** Read Write File Stream
 * 
 */
export class ReadWriteFileStream extends FileStream {
    public mode:FsDb.WriteFileType;
    private _read:number;
    private _write:number;

    constructor(value:FileConnection, mode:FsDb.WriteFileType) {
        super(value);
        this.mode = mode;
        this._read = 0;
        if(mode === "Append")
            this._write = this._ref.value.length;
        else
            this._write = 0;
    }

    write(chunk:any): void {
        const s = betterToString(chunk);
        switch(this.mode){
            case "Prepend":
                this._write = 0;

            case "Insert": {
                const buffer = this._ref.value.Text();
                this._ref.value = new Encoding(buffer.substring(0, this._write) + s + buffer.substring(this._write));
                this._write += s.length;
                break;
            }
            
            case "Override": {
                const buffer = this._ref.value.Text();
                this._ref.value = new Encoding(buffer.substring(0, this._write) + s
                                + buffer.substring(this._write += s.length));
                break;
            }

            case "Rewrite":
                this._ref.value = new Encoding(s);
                this._write = this._ref.value.length;
                break;

            case "Append":
            default: {
                const buffer = this._ref.value.Text() + s;
                this._ref.value = new Encoding(buffer);
                this._write = this._ref.value.length;
            }
        }
    }

    async get(pattern?:string|RegExp):Promise<string> {
        //Convert String Pattern into Regex capture everything before.
        if(typeof pattern === "string")
            pattern = new RegExp(`^(.*?)${pattern}`);
        
        while(true) {
            const {value, pos} = getNext(this.buffer.Text(), this._read, pattern);
        
            if(value){
                this._read = pos;
                return value;
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

    flush(){
        this._read = this.buffer.length;
        this._write = this.buffer.length;
    }

    reset(){
        this._read = 0;
    }

    onUpdate(listener:()=>any){
        this._ref.onUpdate(listener);
    }
}