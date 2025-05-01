/** /System/File/Connection
 * 
 * @author Alex Malotky
 */
import {writeToFile, closeFile} from "./Database";

//Write Message Interface
interface WriteMessage {
    name:FileConnection,
    value: string
}

//Auto Close Connections 
const AutoCloseRegistry = new FinalizationRegistry<WeakRef<FileConnection>>((value)=>{
    value.deref()?.close();
});

/** File Connection
 * 
 */
export default class FileConnection {
    protected bc:BroadcastChannel|null;
    private _v:string;

    constructor(path:string, value:string) {
        this.bc = new BroadcastChannel(path);
        this._v = value;

        const ref = new WeakRef(this);
        AutoCloseRegistry.register(ref, ref);

        this.bc.addEventListener("message", (ev:MessageEvent<WriteMessage>)=>{
            if(ev.data.name !== this)
                this._v = ev.data.value;
        });
    }

    get value():string {
        return this._v
    }

    set value(v:string){
        this._v = v;
        if(this.bc !== null)
            writeToFile(this.bc.name, {user: this, type: "Override"}, v);
    }

    get fileName():string|null {
        return this.bc?.name || null
    }

    close() {
        if(this.bc !== null)
            closeFile(this);
    }
}