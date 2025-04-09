/** System.ts
 * 
 * @author Alex Malotky
 */
import Bios, {BiosType, sleep} from "./Bios";
import View from "./View";
import {InputStream, OutputStream} from "./Stream";
import App from "./App";
import Settings from "../Settings";
import { KeyCode, KeyCodeType } from "./Keyboard";

export {App};

const apps:Map<string, App> = new Map();

/** System Class
 * 
 */
export default class System extends HTMLElement{
    #bios: BiosType;
    #callstack: App[];
    #input: InputStream;
    #output: OutputStream;
    #view: View | null;

    protected: boolean;
    

    constructor(){
        super();
        this.#bios = Bios(this);
        this.#callstack = [];
        this.#input = new InputStream();
        this.#output = new OutputStream();
        this.#view = null;
        this.protected = false;
        
        ///////////////////////////// Bios Event Listeners ///////////////////////////////////

        /** Input Event Listener
         * 
         * Handles keys being pressed
         * 
         * @param {CustomEvent} Event
         */
        //@ts-ignore
        this.addEventListener("input", (event:CustomEvent<KeyCodeType>)=>{
            switch(event.detail){
                case KeyCode.BACK_SPACE:
                    this.#input.remove();
                    break;
                
                case KeyCode.ARROW_UP:
                    this.#input.set(this.current.moveHistory(-1));
                    break;
    
                case KeyCode.ARROW_DOWN:
                    this.#input.set(this.current.moveHistory(1));
                    break;
    
                case KeyCode.ENTER:
                    this.#input.add(  String.fromCharCode(event.detail) );
                    if(!this.protected && this.#view === null){
                        this.#output.add(this.#input.buffer);
                    }
                    this.#input.clean();
                    break;
    
                default:
                    this.#input.add( String.fromCharCode(event.detail) );
                    break;
            }      
        });

        /** Render Event Listener
         * 
         * Handles the render event
         */
        this.addEventListener("render", ()=>{
            if(this.#view !== null){
                //this.#bios.render(this.#view);
    
                if(!this.#view.running)
                    this.#view = null;
            } else {
    
                //Normal Render
                let x = this.#bios.x;
                let y = this.#bios.y;
    
                const output = (char: string) => {
                    if(char == '\n' || char == '\r') {
                        x = 0;
                        y++;
                    }  else {
                        this.#bios.put(x,y,char);
                        x++;
                    }
    
    
                    if(x > this.#bios.width) {
                        x = 0;
                        y++;
                    }
    
                    if(y > this.#bios.height) {
                        this.#bios.height += this.#bios.height;
                        this.#bios.scroll(y);
                    }
                }
    
                if(this.#output.isReady()) {
                    for(let char of this.#output.flush()){
                        output(char);
                    }
                }
    
                if( !this.protected) {
                    for(let char of this.#input.buffer){
                        output(char)
                    }
                }
    
                this.#bios.put(x, y, "█");
            }
        })
    }

    public println(s:string){
        this.print(s+'\n');
    }

    public print(s:string){
        this.#output.add(s);
        this.#input.clear();
    }

    static addFunction(call:string, description: string, callback: (s:System, a:any)=>Promise<void>){
        if(typeof call !== "string")
            throw new TypeError("Function call must be a string!");

        if(typeof description !== "string")
            throw new TypeError("Function description must be a string!");

        if(typeof callback !== "function" || callback.length < 2)
            throw new TypeError("Callback function must be a function that accepts two arguments!");

        const temp = new App(call, description);
        temp.main = callback;
        System.addApp(temp);
    }

    static addApp(app: App){
        if(app instanceof App){
            if(apps.has(app.call))
                throw new Error("Call is already in use");

            apps.set(app.call, app);
        } else {
            throw new Error("Not an App!");
        }
    }

    static getApp(name:string) {
        return apps.get(name) || null
    }

    public async run(args: Array<string>){
        this.#input.clear();

        let p = await this.current.main(this, args);
        if(this.#view !== null){
            this.#view?.delete();
        }
        
        return p;
    }

    get current():App{
        return this.#callstack[this.#callstack.length-1];
    }

    [Symbol.iterator](){
        return apps.keys();
    }

    reset(){
        this.#input.clear();
        this.#output.clear();
    }

    close(){
        this.#bios.shutdown();
    }

    get(char: string = '/s'){
        return this.#input.get(char);
    }

    getln(){
        return this.#input.getln();
    }

    async getPassord(){
        this.protected = true;
        let output: string = await this.#input.getln();
        this.protected = false;
        return output;
    }

    /*async getView(){
        this.#output.clear();

        while(!this.#output.isReady()){
            await sleep();
        }
        this.#view = new View(this.#bios.view());
        return this._view;
    }*/

    
}