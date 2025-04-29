import System, {start as startSystem, clear} from "./System";
import { init as initFS, InitData as InitialFiles, FileSystem } from "./System/Files";
import SystemFiles from "./Operations";
import Help from "./Help";
import SettingsApp from "./Settings";
import Snake from "./Snake";

export type StartFunction = ()=>Promise<void>

/** Merge Inital Files
 * 
 * @param {InitialFiles} os 
 * @param {InitialFiles} optional 
 */
function merge(os:InitialFiles, optional:InitialFiles = {}):InitialFiles {
    const output:InitialFiles = JSON.parse(JSON.stringify(os));

    for(const name in optional){
        switch(output[name]) {
            case "object":
                if(typeof optional[name] === "object") {
                    output[name] = merge(output[name] as any, optional[name])
                }
            break;

            case "string":
                if(typeof optional[name] === "string") {
                    output[name] = optional[name];
                }
                break;

            default:
                output[name] = JSON.parse(JSON.stringify(optional[name]));
        }
    }

    return output;
}

/** Initalize Terminal Operating System
 * 
 */
export function init(files?:InitialFiles):StartFunction {

    for(const call in FileSystem){
        const {desc, main} = FileSystem[call];
        System.addFunction(call, desc, main);
    }

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
    System.addFunction("exit", "Closes the terminal.", ()=>{
        System.println("Good Bie!")
        System.close();
    });

    System.addApp(new Help());
    System.addApp(new SettingsApp());
    System.addApp(new Snake());

    const ready = Promise.all([
        initFS(merge(SystemFiles, files)),

    ])

    /** Start Terminal
     * 
     */
    return async function start() {
        await ready;
        await startSystem();
    }
    
}

