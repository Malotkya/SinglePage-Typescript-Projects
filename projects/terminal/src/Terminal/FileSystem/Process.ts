import System, {MainFunction} from "..";
import {normalize, relative} from "./Path";
import fs from ".";

let location:string = "/";

interface FileSystemProcess {
    desc: string
    main: MainFunction
}

const process:Record<string, FileSystemProcess> = {
    "dir": {
        desc: "List items in Directory",
        main: async()=>{
            const list = await fs.readdir(location);
            System.println(list.join("\n"));
            System.println(list.length.toString());
        }
    },
    "mkdir": {
        desc: "Make Directory",
        main: async(args)=>{
            if(args[1] === undefined)
                System.println("Error: No directory name specified!");
            else
                await fs.mkdir(relative(location, args[1]));
        }
    },
    "cd": {
        desc: "Change Directory",
        main: async(args)=>{
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
    },
    ".": {
        desc: "",
        main: ()=>System.println(location)
    }
}
export default process