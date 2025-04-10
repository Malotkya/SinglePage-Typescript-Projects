/** /Terminal/Stream
 * 
 * Attempting to mimic streams to handle input and output of strings.
 * 
 * @author Alex Malotky
 */
import {sleep} from ".";

/** Stream Class
 * 
 * This class acts like a stream to handle inputs and outputs.
 */
export default class Stream {
    protected _buffer: string;

    public constructor(){
        this._buffer = "";
    }

    protected pull(index: number){
        if(index >= 0){
            let temp = this._buffer.substring(0, index);
            if(temp !== "")
                return temp;
        }
        return null;
    }

    public add(s: string|Object){
        this._buffer += s;
    }

    public remove(){
        this._buffer = this._buffer.slice(0, -1);
    }

    public set(s: string){
        this._buffer = s;
    }

    public clear(){
        this._buffer = "";
    }

    public isReady(){
        return this._buffer.length !== 0;
    }

    public flush(i: number = this._buffer.length){
        return this._buffer.slice(0, i);
    }
}

export class InputStream extends Stream {
    private _print: string;

    public constructor(){
        super();
        this._print = "";
    }

    public set(s: string|undefined){
        if(s) {
            this._print = s;
            this._buffer = s;
        }
    }

    public add(s: string){
        this._print += s;
        this._buffer += s;
    }

    public remove(){
        this._buffer = this._buffer.slice(0, -1);
        this._print = this._print.slice(0, -1);
    }
    
    async get(char:string|undefined){
        while(true){
            let index = 1;
            if(char)
                index = this._buffer.indexOf(char[0]);
            let output = this.pull(index);

            if(output !== null)
                return output;

            await sleep();
        }
    }

    async getln(){
        while(true){
            let n = this._buffer.indexOf("\n");
            let r = this._buffer.indexOf("\r");

            let temp = this.pull(n);
            if(temp !== null){
                this.flush(n);
                return temp;
            }

            temp = this.pull(r);
            if(temp !== null){
                this.flush(r);
                return temp;
            }

            sleep();
        }
    }

    public get buffer(){
        return this._print;
    }

    public clean(){
        this._print = "";
    }
}

export class OutputStream extends Stream {
    
}