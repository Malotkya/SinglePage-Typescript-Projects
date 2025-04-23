/** /Terminal
 * 
 * @author Alex Malotky
 */
import {BiosType, HighlighMap, claimBios, getView} from "./Bios";
import View, {SystemView, UserView} from "./View";
import {InputStream, OutputStream, getHighlighted} from "./Stream";
import App from "./App";
import { KeyboardData } from "./Keyboard";
import History from "./History";
import { MouseButton} from "./Mouse";
import { comparePositions } from "./Position";
import Arguments from "./Arguments";

export {App};

export type MainFunction = (args:Arguments)=>Promise<unknown>|unknown;
export type HelpFunction = ()=>Promise<void>|void;

export interface Process {
    readonly history?: History<string>
    readonly call: string
    readonly description?:string
    readonly help?: HelpFunction
    readonly main: MainFunction
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
let view: SystemView|null = null;
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
     * @returns {UserView}
     */
    getView(w?:number, h?:number): UserView{
        const {template, init} = getView(w!, h!);
        const clear = (v:View|null) => {
            view = v;
            init(v);
        }

        return new View(template, clear);
    },

    get history():History<string> {
        return history;
    },

    get call() {
        return SYSTEM_NAME;
    },

    async run(cmd:string) {
        const args = new Arguments(cmd);
        System.history.add(cmd);
    
        let app = System.getApp(args[0]);
    
        if(app){
            callstack.push(app);
            input.flush();
            try {
                const e = await app.main(args);

                if(view !== null)
                    view.close();

                if(e)
                    throw e;

            } catch (e:any) {
                System.println(`${cmd[0]} crashed with error:\n${e.message || String(e)}`);
            }
            
            callstack.pop();
        } else {
            System.println(`Unknown Command: '${args[0]}'!`);
        }
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
class TerminalInterface extends HTMLElement{
    #bios: BiosType;

    constructor(){
        super();
        this.#bios = claimBios(this);

        
        this.addEventListener("keyboard", (event:CustomEventInit<KeyboardData>)=>{
            if(event.detail === undefined)
                throw new Error("Missing Keyboard Detail!");

            if(view !== null){
                view.keyboard(event as any);
            } else {
                this.keyboard(event as any);
            }
        });

        this.addEventListener("mouse", (event:CustomEventInit<MouseButton>)=>{
            if(event.detail === undefined)
                throw new Error("Missing Mouse Detail!");

            if(view !== null){
                view.mouse(event as any);
            } else {
                this.mouse(event as any);
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
    keyboard(event:CustomEvent<KeyboardData>) {
        this.#bios.scroll(undefined, true);
        const current = System.current;
        const {key, value} = event.detail;

        switch(key){
            case "Backspace":
                input.backspace();
                break;

            case "Delete":
                input.delete();
                break;
                    
            case "ArrowUp":
                if(current.history){
                    current.history.index -= 1;
                    input.set(current.history.current);
                }
                break;
        
            case "ArrowDown":
                if(current.history){
                    current.history.index += 1;
                    input.set(current.history.current);
                }
                break;

            case "ArrowLeft":
                input.cursor--;
                break;

            case "ArrowRight":
                input.cursor++;
                break;

            case "ControlLeft":
            case "ControlRight":
                if(this.#bios.Keyboard.isKeyPressed("KeyC"))
                    this.copy(this.#bios.highlight);
                break;
        
            case "Enter":
            case "NumpadEnter":
                output.add(PROMPT+input.enter());
                break;
        
            default:
                input.add( value );
                break;
        }
    }

    /** Mouse Event Handler
     * 
     * @param event 
     */
    mouse(event: CustomEvent<MouseButton>) {
        if(event.detail === "Secondary") {
            navigator.clipboard.readText().then((string)=>{
                input.set(string);
            });
        }
    }

    /** Render Event Listener
     * 
     */
    render(event:Event) {
        if(output.ready)
            this.#bios.print(output.buffer.padEnd(1, "\n"));
        
        if(!password) {
            this.#bios.print(PROMPT+input.buffer);
        }
    
        this.#bios.cursor(input.cursor-input.buffer.length);
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
        if(string === "")
            continue;
    
        System.run(string);
    }
}

/** Clear Output
 * 
 */
export function clear(modifier:string) {
    if(modifier === "-a") {
        input.flush();
        output.flush();
        history.clear();
        localStorage.clear();
    } else {
        output.flush();
        input.flush();
    }
}