import { BufferReference, ReadStream, WriteStream } from ".";
import { KeyCode } from "../Terminal/Keyboard";

/** Input Buffer
 * 
 * Wrapper around a buffer reference that allows for input manipultaion.
 */
export class InputBuffer implements BufferReference<string> {
    private _ref:BufferReference<string>;
    private _cursor:number;
    public hide:boolean;

    constructor(ref:BufferReference<string>){
        this._ref = ref;
        this._cursor = 0;
        this.hide = false;
    }

    add(c:string){
        this._ref.value = this._ref.value.substring(0, this._cursor)
            + c.charAt(0) + this._ref.value.substring(++this._cursor);
    }

    delete(){
        if(this._cursor < 0 || this._cursor > this._ref.value.length)
            return;

        if(this._ref.value.length > 0){
            if(this._cursor === 0){
                this._ref.value = this._ref.value.substring(1);
            } else {
                this._ref.value = this._ref.value.substring(0, this._cursor)
                                + this._ref.value.substring(this._cursor+1);
            }
        }
    }

    get value() {
        return this._ref.value;
    }

    set value(v:string) {
        this._ref.value = v;
        this._cursor = v.length;
    }

    set cursor(v:number) {
        this._cursor = v;
    }

    get cursor():number {
        if(this._cursor < 0)
            return 0;
        else if(this._cursor > this._ref.value.length)
            return this._ref.value.length;
        return this._cursor;
    }

    keyboard(key:KeyCode, value:string) {
        switch(key){
            case "Backspace":
                this.cursor -=1;
                this.delete();
                break;

            case "Delete":
                this.delete();
                break;

            case "ArrowLeft":
                this.cursor--;
                break;

            case "ArrowRight":
                this.cursor++;
                break;
            
            case "Enter":
            case "NumpadEnter":
                this.value += "\n";
                break;
            
            default:
                this.add( value );
                break;
        }
    }
}

/** Input Stream
 * 
 */
export class InputStream extends ReadStream {
    declare _ref:InputBuffer;
    

    constructor(buffer:InputBuffer) {
        super(buffer);
    }

    flush() {
        this._ref.value = "";
        this._pos = 0;
        this._ref.cursor = 0;
    }
    
    get hide():boolean {
        return this._ref.hide;
    }

    set hide(v:boolean){
        this._ref.hide = v;
    }
}

/** Output Buffer
 * 
 * Wrapper around Buffer Reference for output maniputlation.
 */
export class OutputBuffer implements BufferReference<string> {
    private _ref:BufferReference<string>;

    constructor(ref:BufferReference<string>){
        this._ref = ref;
    }

    get value():string {
        return this._ref.value;
    }

    set value(v:string) {
        this._ref.value = v;
    }
}

/** Output Stream
 * 
 */
export class OutputStream extends WriteStream {
    declare _ref:OutputBuffer;

    constructor(buffer:OutputBuffer){
        super(buffer);
    }

    clear(){
        this._ref.value = "";
    }
}