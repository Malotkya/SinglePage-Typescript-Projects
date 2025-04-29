/** /Terminal
 * 
 * @author Alex Malotky
 */
import App from "./App";
import Arguments from "./Arguments";
import History from "./History";
import { initView, initIO, getView } from "./Terminal";
import { UserView } from "./Terminal/View";

export {App};

export type MainFunction = (a:Arguments)=>Promise<unknown>|unknown;
export type HelpFunction = ()=>Promise<unknown>|unknown;

export interface Process {
    readonly history?: History<string>
    readonly call: string
    readonly description?:string
    readonly help?: HelpFunction
    readonly main: MainFunction
}

const SYSTEM_NAME = "Terminal System";
const SYSTEM_CALL = SYSTEM_NAME.toLocaleLowerCase();

///// Private Attributes of System ///////
const apps:Map<string, Process> = new Map();
const history: History<string> = new History("System");
const callstack: Process[] = [];
const {stdin, stdout} = initIO();
let running = false;

/** System Interface
 * 
 * The main way for applications to interact with the terminal.
 * 
 */
const System = {
    /** Print String
     * 
     * @param {any} a
     */
    print(...a:any[]){
        for(let c of a)
            stdout.write(c);
        stdin.flush();
    },

    /** Print Line
     * 
     * @param {any} a 
     */
    println(...a:any) {
        this.print(...a, '\n');
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
     * @returns {Promise<string>}
     */
    get(char?:string):Promise<string>{
        return stdin.get(char);
    },

    /** Get Line
     * 
     * Will get a stirng up to newline.
     * 
     * @returns {Promise<string>}
     */
    getln():Promise<string>{
        return stdin.getln();
    },

    /** Get Next Input
     * 
     * @returns {Promise<string>}
     */
    next():Promise<string> {
        return stdin.next();
    },

    /** Get Password
     * 
     * Calls getLn and blocks printing of characters.
     * 
     * @returns {string}
     */
    async getPassord(){
        stdin.hide = true;
        let output: string = await stdin.getln();
        stdin.hide = false;
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
        stdin.flush();
        stdout.flush();
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
        return initView(w, h);
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
            stdin.flush();
            try {
                const e = await app.main(args);

                if(e)
                    throw e;

                await (getView()?.wait());

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

export function getHistory():History<string>|null{
    return callstack[callstack.length-1].history || null;
}

/** Sleep
 *  
 * @param s 
 * @returns nothing
 */
export function sleep(s:number = 100): Promise<void>{
    return new Promise((r)=>window.setTimeout(r,s));
}


/** Start System
 * 
 */
export async function start() {
    if(running)
        throw new Error("System is already running!");
    
    callstack.push(<any>System);
    stdin.flush();
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
        stdin.flush();
        stdout.flush();
        history.clear();
        localStorage.clear();
    } else {
        stdin.flush();
        stdout.flush();
    }
}





