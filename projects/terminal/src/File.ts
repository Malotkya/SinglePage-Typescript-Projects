/** /System/Files/Process
 * 
 *  Info and Deeper Access 
 * 
 * @author Alex Malotky
 */
import System, {MainFunction, formatSystemDate} from "./System";
import {relative, join} from "./System/Kernel/Path";
import fs, {SystemStats} from "./System/File";
import { currentLocation } from "./System/File";

/** System Stats To String Helper
 * 
 * @param {SystemStats} stat 
 * @param {string} name 
 * @returns {Promise<string>}
 */
async function toString(stat:SystemStats, name:string = stat.name):Promise<string> {
    let string = formatSystemDate(stat.created);
    
    if(stat.isFile()) {
        const size = await fs.size(stat.path + "/" + stat.name);
        string += size.toString().padStart(10).slice(-10);
    } else {
        string += "   <dir>   ";
    }

    return string + ` ${name}`
}

export default {
    ".": ()=>System.println(currentLocation()),
    "dir": async()=>{
        const location = currentLocation();
        const size = await fs.size(location);
        System.println(`Reading: ${location}\n`);

        const home = (await fs.stats(location))!;
        System.println(await toString(home, "."));

        if(location !== "/") {
            const parrent = (await fs.stats(location))!;
            System.println(await toString(parrent, ".."));
        }
        
        for(const dir of (await fs.readdir(location)).sort()) {
            const stat = (await fs.stats(join(location, dir)))!;
            System.println(await toString(stat))
        }

        System.println("");
    },
    "mkdir": async(args)=>{
        if(args[1] === undefined) {
            System.println("Error: No directory name specified!");
            return;
        }
        try {
            await fs.mkdir(relative(args[1]));
        } catch (e){

        }
            
    },
    "cd": async(args)=>{
        if(args[1] === undefined) {
            System.println("Error: No directory name specified!");
            return;
        }
        
        try {
            await fs.cd(relative(args[1]))
        } catch (e){
            System.println(e);
        }
    },
    "rm": async(args)=>{
        const recursive:boolean = args.get("-r") !== undefined;
        const force:boolean     = args.get("-f") !== undefined;
        const path:string|undefined = args[1+Number(recursive)+Number(force)];

        if(path === undefined || (path === "-r" || path === "-f") ) {
            System.println("Error: No file or directory name specified!");
            return;
        }

        try {
            await fs.rm(relative(path), {recursive, force});
        } catch (e){
            System.println(e);
        }
    },
    "mv": async(args)=>{
        const clone:boolean = args.get("-c") !== undefined;
        const force:boolean = args.get("-f") !== undefined;
        const from:string|undefined = args[1+Number(clone)+Number(force)];
        const to:string|undefined   = args[2+Number(clone)+Number(force)];

        if(from === undefined || (from === "-r" || from === "-f") ) {
            System.println("Error: No from path name specified!");
            return;
        }else if(to === undefined || (to === "-r" || to === "-f") ) {
            System.println("Error: No target path name specified!");
            return;
        }

        try {
            if(clone)
                await fs.copy(relative(from), relative(to), {force});
            else
                await fs.move(relative(from), relative(to), {force});
        } catch (e){
            System.println(e);
        }
    },
    "chmod": async(args)=>{
        const value:number = Number(args[1]);
        const path:string|undefined = args[2];

        if(isNaN(value)) {
            System.println("Mode value must be a number!");
            return;
        } else if(path === undefined){
            System.println("Error: No path name specified!");
            return;
        }

        try {
            await fs.chmod(path, value);
        } catch (e){
            System.println(e);
        }
    }
} satisfies Record<string, MainFunction>;