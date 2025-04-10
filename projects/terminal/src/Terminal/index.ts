/** /Terminal
 * 
 * @author Alex Malotky
 */
import Bios, {BiosType} from "./Bios";
import View from "./View";
import {InputStream, OutputStream} from "./Stream";
import App, {HelpFunction, MainFunction} from "./App";
import { KeyCode } from "./Keyboard";
import IndexList from "@/IndexList";

export {App};

export interface Process {
    readonly history: IndexList<string>
    readonly call: string
    readonly description?:string
    readonly help?: HelpFunction
    readonly run:MainFunction
}

const SYSTEM_NAME = "Terminal System";
const SYSTEM_CALL = SYSTEM_NAME.toLocaleLowerCase();

///// Private Attributes of System ///////
const apps:Map<string, Process> = new Map();
const callstack: Process[] = [];
const history: IndexList<string> = new IndexList();
const input = new InputStream();
const output = new OutputStream();
let view: View|null = null;
let password = false;
let running = false;

/** System Interface
 * 
 * The main way for applications to interact with the terminal.
 * 
 */
const System = {
    /** Print String
     * 
     * @param {string} s 
     */
    print(s:string){
        output.add(s);
        input.clear();
    },

    /** Print Line
     * 
     * @param {string} s 
     */
    println(s:string) {
        this.print(s+'\n');
    },

    /** Add App 
     * 
     * @param {App} app 
     */
    addApp(app: App){
        if(app instanceof App){
            if(apps.has(app.call) || app.call === SYSTEM_CALL)
                throw new Error("Call is already in use");

            apps.set(app.call, app);
        } else {
            throw new Error("Not an App!");
        }
    },

    /** Add Function
     * 
     * @param {string} call 
     * @param {string} description 
     * @param {MainFunction} callback 
     */
    addFunction(call:string, description: string, callback:MainFunction){
        if(typeof call !== "string")
            throw new TypeError("Function call must be a string!");

        if(typeof description !== "string")
            throw new TypeError("Function description must be a string!");

        if(typeof callback !== "function")
            throw new TypeError("Callback function must be a function!");

        call = call.toLocaleLowerCase();
        if(apps.has(call) || call === SYSTEM_CALL)
            throw new Error("Call is already in use");

        apps.set(call, {
            call, description,
            history: new IndexList(),
            run: callback
        });
    },

    /** Get App
     * 
     * @param {string} name 
     * @returns {App|null}
     */
    getApp(name:string) {
        return apps.get(name) || null
    },

    /** Get String
     * 
     * Will get a single char or until matched string
     * 
     * @param {string} char 
     * @returns {string}
     */
    get(char?:string){
        return input.get(char);
    },

    /** Get Line
     * 
     * Will get a stirng up to newline.
     * 
     * @returns {string}
     */
    getln(){
        return input.getln();
    },

    /** Get Password
     * 
     * Calls getLn and blocks printing of characters.
     * 
     * @returns {string}
     */
    async getPassord(){
        password = true;
        let output: string = await input.getln();
        password= false;
        return output;
    },

    /** Run Arguments
     * 
     */
    async run(){
        if(running)
            throw new Error("System is already running!");
        
        callstack.push(System);
        input.clear();
        running = true;

        while(running) {
            System.print("\n$: ");
            let string = await System.getln();
        
            let cmd = string.split(/\s+/gm);
            System.history.add(string)
        
            let app = System.getApp(cmd[0]);
        
            if(app){
                callstack.push(app);
                input.clear();
                try {
                    const e = await app.run(cmd);

                    if(view !== null)
                        view.delete();

                    if(e)
                        throw e;

                } catch (e:any) {
                    System.println(`${cmd[0]} crashed with error:\n${e.message || String(e)}`);
                }
                
                callstack.pop();
            } else {
                System.println("Unknown Command!");
            }
        }
    },

    /** Get Current
     * 
     */
    get current():Process{
        return callstack[callstack.length-1];
    },

    /** Loop over Apps
     * 
     * @returns {MapIterator<[string, Process]>} 
     */
    [Symbol.iterator](){
        return apps.entries();
    },

    /** Reset System
     * 
     */
    reset(){
        input.clear();
        output.clear();
    },

    /** Close System
     * 
     */
    close() {
        running = false;
        window.location.replace("/");
    },

    /** Get View
     * 
     * @returns {View}
     */
    async getView(){
        output.clear();

        while(!output.isReady()){
            await sleep();
        }
        view = <any>null; //new View(this.#bios.view());
        return view;
    },

    get history():IndexList<string> {
        return history;
    },

    get call() {
        return SYSTEM_NAME;
    }
}
export default System;

/** Sleep
 *  
 * @param s 
 * @returns nothing
 */
export function sleep(s:number = 100): Promise<void>{
    return new Promise((r)=>window.setTimeout(r,s));
}

/** Terminal Interface
 * 
 * Acts as the interface between the User and the System through the Bios.
 */
class TerminalInterface extends HTMLElement {
    #bios: BiosType;

    constructor(){
        super();
        this.#bios = Bios(this);

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
                    input.remove();
                    break;
                        
                case KeyCode.ARROW_UP:
                    System.current.history.index -= 1;
                    input.set(System.current.history.current);
                    break;
            
                case KeyCode.ARROW_DOWN:
                    System.current.history.index += 1;
                    input.set(System.current.history.current);
                    break;
            
                case KeyCode.ENTER:
                    input.add(  String.fromCharCode(event.detail) );
                    if(!password && view === null){
                        output.add(input.buffer);
                    }
                    input.clean();
                    break;
            
                default:
                    input.add( String.fromCharCode(event.detail) );
                    break;
            }      
        });
        
        /** Render Event Listener
         * 
         * Handles the render event
         */
        this.addEventListener("render", ()=>{
            if(view !== null){
                /*this.#bios.render(this.#view);
            
                if(!this.#view.running)
                    this.#view = null; */
                alert("Views are currently not supported!");
                view = null;
            } else {
            
                //Normal Render
                let x = this.#bios.x;
                let y = this.#bios.y;
            
                const place = (char: string) => {
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
            
                if(output.isReady()) {
                    for(let char of output.flush()){
                        place(char);
                    }
                }
            
                if( !password) {
                    for(let char of input.buffer){
                        place(char)
                    }
                }
            
                this.#bios.put(x, y, "█");
            }
        });
    }
}

customElements.define("terminal-interface", TerminalInterface)