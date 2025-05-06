/** /System/Files/Process
 * 
 * System calls to allow the user to access the file system.
 * 
 * @author Alex Malotky
 */
import System, {MainFunction, formatSystemDate} from "..";
import {normalize, relative, join} from "./Path";
import fs, {SystemStats} from ".";
import { currentLocation } from ".";

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
    }
} satisfies Record<string, MainFunction>;