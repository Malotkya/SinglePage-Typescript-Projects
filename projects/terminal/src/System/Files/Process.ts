/** /System/Files/Process
 * 
 * System calls to allow the user to access the file system.
 * 
 * @author Alex Malotky
 */
import System, {MainFunction, formatSystemDate} from "..";
import {normalize, relative, join} from "./Path";
import fs, {SystemStats} from ".";

let location:string = "/";

interface FileSystemProcess {
    desc: string
    main: MainFunction
}

/** Get Current Location
 * 
 * @returns {string}
 */
export function currentLocation():string {
    return location;
}

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

const process:Record<string, MainFunction> = {
    ".": ()=>System.println(location),
    "dir": async()=>{
        const size = await fs.size(location);
        System.println(`Reading: ${location}\n`);

        const home = (await fs.stats(location))!;
        System.println(await toString(home, "."));

        if(location !== "/") {
            const parrent = (await fs.stats(normalize(location, "..")))!;
            System.println(await toString(parrent, ".."));
        }
        
        for(const dir of (await fs.readdir(location)).sort()) {
            const stat = (await fs.stats(join(location, dir)))!;
            System.println(await toString(stat))
        }

        System.println("");
    },
    "mkdir": async(args)=>{
        if(args[1] === undefined)
            System.println("Error: No directory name specified!");
        else
            await fs.mkdir(relative(location, args[1]));
    },
    "cd": async(args)=>{
        if(args[1] === undefined) {
            System.println("Error: No directory name specified!");
            return;
        }
            
        const target = normalize(location, args[1]);
        const data = await fs.stats(target);
        if(data === null || !data.isDiretory()) {
            System.println("Unable to find directory: " + args[1]);
            return;
        }

        location = target;
    }
}
export default process