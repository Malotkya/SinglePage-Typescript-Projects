/** /System
 * 
 * @author Alex Malotky
 */
import App from "./App";
import Arguments from "./Arguments";
import History from "./History";
import { initView, getView, setPrompt } from "./Terminal";
import { InputStream, OutputStream } from "./Stream/IO";
import { UserView } from "./Terminal/View";
import { executable, InitData, parseExecutable, currentLocation } from "./Files";
import SystemIterator from "./Iterator";
import { init as initUsers } from "./User";
import { extract } from "../Initalize";

export {App};

export type MainFunction = (a:Arguments)=>Promise<unknown>|unknown;
export type HelpFunction = ()=>Promise<unknown>|unknown;

export interface Process {
    readonly history: boolean
    readonly call: string
    readonly description?:string
    readonly help?: HelpFunction
    readonly main: MainFunction
}

export const SYSTEM_NAME = "Terminal";
export const SYSTEM_PROMPT = "$ ";

///// Private Attributes of System ///////
const systemProcess:Map<string, Process> = new Map();
const loadedProcess:Map<string, Process> = new Map();
const history:Record<string, History> = {}; 
const callstack: Process[] = [];
const stdin = new InputStream();
const stdout = new OutputStream();
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
            const call = validateCall(app.call);
            systemProcess.set(call, app);
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
        call = validateCall(call);

        systemProcess.set(call, {
            call, description,
            main: callback,
            history: false
        });
    },

    /** Load Process
     * 
     * @param {Process} data 
     */
    loadProcess(data:Process) {
        const call = validateCall(data.call);
        if(typeof data.main !== "function")
            throw new TypeError("Not a process!");

        if(data.help && typeof data.help !== "function")
            throw new TypeError("Not a process!");

        if(data.description && typeof data.description !== "string")
            throw new TypeError("Not a process!");

        loadedProcess.set(call, data);
    },

    clearProcesses() {
        loadedProcess.clear();
    },

    /** Get App
     * 
     * @param {string} name 
     * @returns {Process|null}
     */
    getProcess(name:string):Process|null {
        return systemProcess.get(name) || loadedProcess.get(name) || null
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

    async prompt(message:string, password:boolean = false):Promise<string> {
        setPrompt(message);
        stdin.flush();
        stdin.hide = password;
        const output = await stdin.getln();
        this.println(message+(password?"":output));
        stdin.hide = false;
        return output;
    },

    /** Get Password
     * 
     * Calls getLn and blocks printing of characters.
     * 
     * @returns {Promise<string>}
     */
    async getPassord():Promise<string> {
        stdin.hide = true;
        const output: string = await stdin.getln();
        stdin.hide = false;
        return output;
    },

    /** Get Current
     * 
     */
    get current():Process{
        return callstack[callstack.length-1];
    },

    /** Process Iterator
     * 
     * @returns {SystemIterator} 
     */
    [Symbol.iterator]():ReturnType<typeof SystemIterator<Process>>{
        return SystemIterator(systemProcess.entries(), loadedProcess.entries());
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

    /** System History
     * 
     */
    get history():History {
        return history[SYSTEM_NAME];
    },

    /** System Call Name
     * 
     */
    get call() {
        return SYSTEM_NAME;
    },

    /** Run Command
     * 
     * @param {string} cmd 
     */
    async run(cmd:string):Promise<void>{
        const args = new Arguments(cmd);
    
        let exe:Process|null = null;
        try {
            exe = System.getProcess(args[0]) || await executable(args[0], true);
        } catch (e:any){
            System.println(e.message || e);
            return;
        }

        if(exe === null) {
            System.println(`Unknown Command: '${args[0]}'!`);
            return;
        }

        stdin.flush();
        callstack.push(exe);
        if(exe.history){
            history[exe.call] = new History(exe.call);
        }

        try {
            const e = await exe.main(args);
            if(e)
                throw e;

            await (getView()?.wait());

        } catch (e:any){
            System.println(`${args[0]} crashed with error:\n${e.message || String(e)}`);
        }
        
        callstack.pop();
    },

    /** Current Working Directory
     * 
     */
    get cwd():string {
        return currentLocation();
    }
}
export default System;

/** Get Current History
 * 
 * @returns {History<string>|null}
 */
export function getHistory():History|null{
    return history[callstack[callstack.length-1].call] || null;
}

/** Validate System Call
 * 
 * @param value 
 */
export function validateCall(value:string, skipValidation?:boolean):string{
    if(typeof value !== "string")
        throw new TypeError("Call must be a string!");
    value = value.toLocaleLowerCase().trim();

    if(skipValidation)
        return value;
    
    if(value.match(/^[a-z]\w+$/) === null)
        throw new Error("System call can only contain numbers and letters, and must start with a letter!");

    if(systemProcess.has(value) || loadedProcess.has(value))
        throw new Error("Call is already taken!");

    return value;
}

export function formatSystemDate(date:Date, format:"Date"|"Time"|"DateTime" = "DateTime"):string {
    let output:string = "";
    if(format.includes("Date")) {
        const [month, day, year] = date.toLocaleDateString().split("/");
        output += ` ${month}`.slice(-2) + "/" + `0${day}`.slice(-2) + "/" + year;
    }

    if(format.includes("Time")) {
        output += `  ${date.toLocaleTimeString()}`.slice(-12);
    }

    return output.trim();
}

/** Sleep
 *  
 * @param s 
 * @returns nothing
 */
export function sleep(s:number = 100): Promise<void>{
    return new Promise((r)=>window.setTimeout(r,s));
}

export function isRunning(){
    return running;
}

/** Start System
 * 
 */
export async function start(){
    if(running)
        throw new Error("System is already running!");

    callstack.push(<any>System);
    stdin.flush();
    running = true;

    await initUsers();
    history[SYSTEM_NAME] = new History(SYSTEM_NAME);

    while(running) {
        const string = await System.prompt(SYSTEM_PROMPT);
        System.history.add(string);
        System.run(string);
    }
}

export async function initSystem(...args:(InitData|Record<string, MainFunction>)[]):Promise<void> {
    for(const bin of args){
        for(const name in bin) {
            const value = extract(bin[name]);
            switch(typeof value) {
                case "object":
                    initSystem(value as InitData)
                    break;

                case "function":
                    systemProcess.set(
                        validateCall(name, true),
                        {call: name, main: value as MainFunction, history: false}
                    );
                    break;

                default:
                    systemProcess.set(
                        validateCall(name, true), 
                        parseExecutable(value))
            }
        }
    }
}

/** Clear Output
 * 
 */
export function clear(modifier:string) {
    if(modifier === "-a") {
        stdout.clear();
        //History.clear();
    } else {
        stdout.clear();
    }
}
