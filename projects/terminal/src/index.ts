import System, {start as startSystem, clear, initSystem, logout, getHistory} from "./System";
import {Path} from "./System/Kernel";
import fs from "./System/File";
import { Directory, Failure, InitalizeResult } from "./System/Initalize";
import { claimBios, releaseBios, BiosContext } from "./System/IO";
import Help from "./Help";
import Snake from "./Snake";
import { KeyboardData } from "./System/Keybaord";
import { sleep } from "@";
import { MouseButton } from "./System/Mouse";
import { TerminalRegister } from "./System/Registry";

export type StartFunction = ()=>Promise<void>;

export interface SystemInitOptions {
    //rootPassword?:string,
    files?:Directory
}
let ready:InitalizeResult<undefined>|null = null;

/** Initalize Terminal Operating System
 * 
 */
export function init(opts:SystemInitOptions = {}):StartFunction {
    const {files} = opts;
    System.addFunction("about", "Displays more information about the terminal app.", ()=>{
        System.println("This is an attempt to see what I can create in this environement.");
        System.println("I plan to continue to expand the functionality of thie terminal");
        System.println("Goals Include:");
        System.println("[*]: Change the terminal to be desplayed using 2D Graphics.");
        System.println("[*]: Add automatic scrolling functionality");
        System.println("[*]: Persist Settings");
        System.println("[*]: Create a basic game like snake");
        System.println("[*]: Rework Settings into a System Registry (Local Storage or IDB");
        System.println("[ ]: Create Basic File System & User Seperation / Login (IDB)");
    });
    System.addFunction("clear", "Clears the terminal.", (args)=>clear(args[1]));
    System.addFunction("logout", "", ()=>logout())
    System.addFunction("exit", "Closes the terminal.", ()=>{
        System.println("Good Bie!");
        logout();
        System.close();
    });

    System.addApp(new Help());
    System.addApp(new Snake());

    System.addFunction("print", "", async(args)=>{
        if(args[1] === undefined)
            throw new Error("No file specified!");

        const buffer = await fs.readfile(Path.relative(args[1]));
        System.println(buffer.Text());
    });

    initSystem(files).then(result=>{
        ready = result;
    }).catch(e=>{
        console.error(e);
        ready = Failure(new Error(`An unexpected error occured when initalizing the system!`));
    });

    return async function start(){
        while(ready === null)
            await sleep();

        if(ready.type === "Failure"){
            console.error(ready.reason);
        } else {
            await startSystem();
        }
    };
}

/** Terminal Interface
 * 
 * Acts as the interface between the User and the System through the Bios.
 */
class TerminalInterface extends HTMLElement{
    bios:BiosContext|null;

    constructor(){
        super();
        this.bios = null;
        this.style.height = "fit-content";

        this.addEventListener("keyboard", (event:CustomEventInit<KeyboardData>)=>{
            if(event.detail === undefined)
                throw new Error("Missing Keyboard Detail!");

            if(this.bios){
                if(this.bios.view !== null){
                    this.bios.view.keyboard(event as CustomEvent<KeyboardData>);
                } else {
                    this.bios.keyboard(event as CustomEvent<KeyboardData>);
                }
            }
        });

        this.addEventListener("mouse", (event:CustomEventInit<MouseButton>)=>{
            if(event.detail === undefined)
                throw new Error("Missing Mouse Detail!");

            if(this.bios){
                if(this.bios.view !== null){
                    this.bios.view.mouse(event as CustomEvent<MouseButton>);
                } else {
                    this.bios.mouse(event as CustomEvent<MouseButton>);
                }
            }
        });
        
        /** Render Event Listener
         * 
         * Handles the render event
         */
        this.addEventListener("render", (event:Event)=>{
            if(this.bios){
                if(this.bios.view !== null){
                    this.bios.view.render(event);
                } else {
                    this.bios.render(event);
                }
            }
        });
    }

    async connectedCallback(){
        this.innerHTML = "<p class='info'>System is initalizing, this may take a minute!</p>";

        while(ready === null)
            await sleep();

        if(ready.type === "Failure"){
            this.innerHTML = `<p class='error'>System failed with error:<br>${ready.reason.message}</p>`;
            return;
        }

        let reg:TerminalRegister;
        try {
            reg = await System.getRegister("terminal");
        } catch (e) {
            console.error(e);
            this.innerHTML = `<p class='error'>Failed to load the register!</p>`;
            return;
        }

        const result = await claimBios(this, {
            backgroundColor: reg.get("background").get("color"),
            fontColor: reg.get("font").get("color"),
            fontSize: reg.get("font").get("size"),
            width: reg.get("width"),
            height: reg.get("height"),
            getHistory
        });

        if(result.type === "Failure") {
            console.error(result.reason);
            this.innerHTML = `<p class='error'>Bios failed with error:<br>${result.reason.message}</p>`;
            return;
        } else {
            this.bios = result.value;
        }
    }

    disconnectedCallback(){
        releaseBios(this);
    }
    
}

customElements.define("terminal-interface", TerminalInterface);