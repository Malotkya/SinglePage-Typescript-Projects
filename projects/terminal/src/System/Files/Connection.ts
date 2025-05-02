/** /System/File/Connection
 * 
 * @author Alex Malotky
 */
import {writeToFile, closeFile} from "./Database";
import Database from "../Database";

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
    private bc:BroadcastChannel|null;
    private _v:string;
    private _l:((s:string)=>any)|undefined;

    constructor(path:string, value:string) {
        this.bc = new BroadcastChannel(path);
        this._v = value;

        const ref = new WeakRef(this);
        AutoCloseRegistry.register(ref, ref);

        this.bc.addEventListener("message", (ev:MessageEvent<WriteMessage>)=>{
            if(ev.data.name !== this) {
                this._v = ev.data.value;
                if(this._l)
                    this._l(this._v);
            }
                
        });
    }

    onUpdate(listener:(s:string)=>any){
        this._l = listener;
    }

    get value():string {
        return this._v
    }

    set value(v:string){
        this._v = v;
        const ref = Database("FileSystem", "readwrite");
        ref.open().then(async(tx)=>{
            try {
                if(this.bc !== null) {
                    await writeToFile(this.bc.name, {user: this, type: "Override"}, v, tx);
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
            const ref = Database("FileSystem", "readwrite");
            await closeFile(this, await ref.open());
            ref.close();
        }  
    }
}