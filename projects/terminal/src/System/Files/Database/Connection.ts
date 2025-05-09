/** /System/File/Connection
 * 
 * @author Alex Malotky
 */
import {writeToFile, closeFile} from ".";
import { FileData } from "./Schema";
import Queue from "./TransactionQueue";
import Encoding from "../Encoding";

//Write Message Interface
interface WriteMessage {
    name:FileConnection,
    value: FileData
}

//Auto Close Connections 
const AutoCloseRegistry = new FinalizationRegistry<Function>((value)=>value());

/** File Connection
 * 
 */
export default class FileConnection {
    private bc:BroadcastChannel|null;
    private _v:Encoding;
    private _l:((s:Encoding)=>any)|undefined;

    constructor(path:string, value:FileData) {
        this.bc = new BroadcastChannel(path);
        this._v = new Encoding(value);

        const ref = new WeakRef(this);
        AutoCloseRegistry.register(ref, ()=>ref.deref()?.close());

        this.bc.addEventListener("message", (ev:MessageEvent<WriteMessage>)=>{
            if(ev.data.name !== this) {
                this._v = new Encoding(value);
                if(this._l)
                    this._l(this._v);
            }
                
        });
    }

    onUpdate(listener:(s:Encoding)=>any){
        this._l = listener;
    }

    get value():Encoding {
        return this._v;
    }

    set value(v:Encoding){
        this._v = v;
        const ref = Queue("readwrite");
        ref.open().then(async(tx)=>{
            try {
                if(this.bc !== null) {
                    await writeToFile(this.bc.name, {user: this, type: "Override"}, v.data, tx);
                }
            } catch (e){
                console.error(e);
            }
            ref.close();
                
        }).catch(()=>ref.close());
    }

    get fileName():string|null {
        return this.bc?.name || null
    }

    async close() {
        if(this.bc !== null) {
            const ref = Queue("readwrite");
            await closeFile(this, await ref.open());
            ref.close();
        }  
    }
}