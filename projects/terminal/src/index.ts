import System, {start as startSystem, clear, initSystem} from "./System";
import { init as initFS, InitData as InitialFiles, FileSystem, InitData } from "./System/Files";
import { functionToString } from "./System/Script";
import {login, logout} from "./System/User";
import SystemFiles from "./Operations";
import Help from "./Help";
import Snake from "./Snake";

export type StartFunction = ()=>Promise<void>
export type SystemFile = {
    [name:string]: string|Function|SystemFile
}

/** Merge Inital Files
 * 
 * @param {InitialFiles} os 
 * @param {InitialFiles} optional 
 */
function merge(os:SystemFile, optional:SystemFile = {}):InitialFiles {
    const output:InitialFiles = {};

    for(const name of new Set(Object.keys(os).concat(Object.keys(optional)))) {
        if(os[name]) {
            switch (typeof os[name]) {
                case "function":
                    output[name] = functionToString(os[name]);
                    break;

                case "object":
                    output[name] = merge(os[name], typeof optional[name] === "object"? optional: undefined);
                    break;

                case "string":
                    output[name] = os[name];
                    break;

                default:
                    output[name] = String(name);
            }
        } else {
            switch(typeof optional[name]) {
                case "function":
                    output[name] = functionToString(optional[name]);
                    break;

                case "object":
                    output[name] = merge(optional[name]);
                    break;

                case "string":
                    output[name] = optional[name];
                    break;

                default:
                    output[name] = String(optional[name]);
            }
        }
    }

    return output;
}

/** Initalize Terminal Operating System
 * 
 */
export function init(files?:InitialFiles):StartFunction {

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
        System.println("Good Bie!");
        logout();
        System.close();
    });

    System.addApp(new Help());
    System.addApp(new Snake());

    const data = merge(SystemFiles, files);
    const ready = Promise.all([
        initFS(data),
        initSystem(
            FileSystem,
            data["bin"] as InitData
        )
    ]);

    /** Start Terminal
     * 
     */
    return async function start() {
        await ready;
        await startSystem();
    }
    
}

