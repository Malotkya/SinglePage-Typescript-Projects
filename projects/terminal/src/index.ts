import System, {start as startSystem, clear, initSystem, logout} from "./System";
import { initFilestoreDatabase } from "./System/Files/Backend";
import { initStdIO } from "./System/Stream/IO";
import FileSystem from "./System/Files/Process"
import { SystemDirectory, startingFiles } from "./System/Initalize";
import {init as initUsers} from "./System/User";
import Help from "./Help";
import Snake from "./Snake";

export type StartFunction = ()=>Promise<void>;

export interface SystemInitOptions {
    rootPassword?:string,
    files?:SystemDirectory
}

/** Initalize Terminal Operating System
 * 
 */
export function init(opts:SystemInitOptions = {}):StartFunction {
    const {files, rootPassword} = opts;
    if(files)
        startingFiles(rootPassword? "0": null, files);

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

    const ready = Promise.all([
        initFilestoreDatabase(),
        initStdIO(),
        initUsers(rootPassword),
        initSystem(
            FileSystem
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

