/** /Terminal
 * 
 * @author Alex Malotky
 */
import Bios, {BiosType, HighlighMap} from "./Bios";
import View from "./View";
import {InputStream, OutputStream, getHighlighted} from "./Stream";
import App, {HelpFunction, MainFunction} from "./App";
import { KeyCode } from "./Keyboard";
import History from "./History";
import { MouseButton, comparePositions } from "./Mouse";

export {App};

export interface Process {
    readonly history: History<string>
    readonly call: string
    readonly description?:string
    readonly help?: HelpFunction
    readonly main:MainFunction
}

const SYSTEM_NAME = "Terminal System";
const SYSTEM_CALL = SYSTEM_NAME.toLocaleLowerCase();
const PROMPT = "$ ";

///// Private Attributes of System ///////
const apps:Map<string, Process> = new Map();
const callstack: Process[] = [];
const history: History<string> = new History("System");
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
        input.flush();
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
            history: new History(call),
            main: callback
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
        input.flush();
        output.flush();
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
        output.flush();

        view = <any>null; //new View(this.#bios.view());
        return view;
    },

    get history():History<string> {
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

/** Get Highlight String
 * 
 * @param {HighlighMap} map 
 * @param {number} width 
 * @returns {string}
 */
function getSystemHighlighted(map:HighlighMap, width:number):string {
    const [_, end] = map;
    const pos = {x:0, y:0};
    let buffer = output.pull(map, pos, width);

    if(comparePositions(pos, end) < 0){
        buffer += getHighlighted(PROMPT, map, pos, width);
    }

    if(comparePositions(pos, end) < 0) {
        buffer += input.pull(map, pos, width);
    }

    return buffer;
}

/** Terminal Interface
 * 
 * Acts as the interface between the User and the System through the Bios.
 */
class TerminalInterface extends HTMLElement implements View{
    #bios: BiosType;

    constructor(){
        super();
        this.#bios = Bios(this);

        
        this.addEventListener("keyboard", (event:CustomEventInit<KeyCode>)=>{
            if(view !== null){
                view.keyboard(event);
            } else {
                this.keyboard(event);
            }
        });

        this.addEventListener("mouse", (event:CustomEventInit<MouseButton>)=>{
            if(view !== null){
                view.mouse(event);
            } else {
                this.mouse(event);
            }
        });
        
        /** Render Event Listener
         * 
         * Handles the render event
         */
        this.addEventListener("render", (event:Event)=>{
            if(view !== null){
                view.render(event);
            } else {
                this.render(event);
            }
        });
    }

    /** Input Event Handler
     * 
     * Handles keys being pressed
     * 
     * @param {CustomEvent} Event
     */
    keyboard(event:CustomEventInit<KeyCode>) {
        this.#bios.scroll(undefined, true);
        switch(event.detail){
            case "Backspace":
                input.remove();
                break;
                    
            case "ArrowUp":
                System.current.history.index -= 1;
                input.set(System.current.history.current);
                break;
        
            case "ArrowDown":
                System.current.history.index += 1;
                input.set(System.current.history.current);
                break;

            case "ControlLeft":
            case "ControlRight":
                if(this.#bios.KeyBoard.isKeyPressed("KeyC"))
                    this.copy(this.#bios.highlight);
                break;
        
            case "Enter":
                input.add("\n");
                output.add(PROMPT+input.buffer);
                input.clean();
                break;
        
            default:
                if(event.detail)
                    input.add( event.detail );
                break;
        }
    }

    /** Mouse Event Handler
     * 
     * @param event 
     */
    mouse(event: CustomEventInit<MouseButton>) {
        console.debug(event.detail);
        if(event.detail === "Secondary") {
            navigator.clipboard.readText().then((string)=>{
                input.set(string);
            })
        }
    }

    /** Render Event Listener
     * 
     */
    render(event:Event) {
        if(output.ready)
            this.#bios.print(output.buffer.padEnd(1, "\n"));
        
        if( !password) {
            this.#bios.print(PROMPT+input.buffer);
        }
    
        this.#bios.cursor();
        this.#bios.scroll();
    }

    copy(map:HighlighMap|null):void {
        if(map){
            navigator.clipboard.writeText(getSystemHighlighted(map, this.#bios.width));
        }
    }
}

customElements.define("terminal-interface", TerminalInterface);

/** Start System
 * 
 */
export async function start() {
    if(running)
        throw new Error("System is already running!");
    
    callstack.push(<any>System);
    input.flush();
    running = true;

    while(running) {
        let string = await System.getln();
    
        let cmd = string.split(/\s+/gm);
        System.history.add(string);
    
        let app = System.getApp(cmd[0]);
    
        if(app){
            callstack.push(app);
            input.flush();
            try {
                const e = await app.main(cmd);

                if(view !== null)
                    void 0; //view.delete();

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
}

/** Clear Output
 * 
 */
export function clear() {
    output.flush();
    input.flush();
}