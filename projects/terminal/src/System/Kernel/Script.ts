/** /System/Kernel/Script
 *  
 * @author Alex Malotky
 */
import Queue from "./File/TransactionQueue";
import * as Path from "./Path";
import { executable, executableDirectory, writeToFile } from "./File";
import Encoding, {encodeValue} from "./Encoding";
import User, {UserId} from "./User";
import { FileError } from "./Errors";

/** Function To String
 * 
 * @param {Function} fun 
 * @returns {string}
 */
export function functionToString(fun:Function):string {
    const value = (""+fun).replaceAll(/\s+/g, " ");

    let match = value.match(/^.*?{(.*)}.*?$/);
    if(match)
        return match[1];

    match = value.match(/^.*?=>(.*?)$/);
    if(match)
        return match[1];

    return value;
}

/** Parse Script to Data
 * 
 * @param {Encoding} file 
 * @param {string} name 
 * @returns {Record<string, string>}
 */
function _parse(file:Encoding, name:string):Record<string, string> {
    const data:Record<string, string> =  {name: name};
    let buffer = file.Text();

    let match:RegExpMatchArray|null = buffer.match(/^([a-z]+):/im);
    let n:string = "*";

    while(match !== null) {
        const index = buffer.indexOf(match[0]);
        const newName = match[1].toLocaleLowerCase();
        const value = buffer.substring(0, index);
        buffer = buffer.substring(index+match[0].length);

        data[n.toLocaleLowerCase().trim()] = value;
        name = newName;

        match = buffer.match(/^([a-z]+):/im);
    }

    data[n] = buffer

    return data;
}

/** Load Script Data From File
 * 
 * @param {string} path 
 * @param {UserId} id 
 * @returns {Promise<Record<string, string>>}
 */
export async function loadScript(path:string, id:UserId = User.id):Promise<Record<string, string>> {
    const ref = Queue("readonly");
    const file = new Encoding(await executable(path, id, await ref.open()));
    ref.close();

    const {name} = Path.parse(path);
    return _parse(file, name)
}

/** Load Script Datas form Directory
 * 
 * @param {string} path 
 * @param {UserId} id
 * @returns {Promise<Array>}
 */
export async function loadDirectory(path:string, id:UserId = User.id):Promise<Record<string, string>[]> {
    const ref = Queue("readonly");
    const tx = await ref.open();
    const data = await executableDirectory(path, id, tx);
    ref.close();

    const output:Record<string, string>[] = [];
    for(const name in data){
        output.push(_parse(new Encoding(data[name]), name))
    }

    return output;
}

export interface WritingExecutableOptions {
    user?: UserId
    force?: boolean
}

/** Write Script Data to File
 * 
 * @param {string} path 
 * @param {Record<string, string>} data 
 * @param {WritingExecutableOptions} opts 
 */
export async function writeScript(path:string, data:Record<string, string>, opts:WritingExecutableOptions = {}):Promise<void> {
    const {user = User.id, force} = opts;

    let buffer:string;
    if(data["*"]) {
        buffer = data["*"];
    } else {
        buffer = "";
        if(data["description"])
            buffer += "description: "+data["description"]+"\n";

        if(data["history"])
            buffer += "history: "+data["history"]+"\n";
        
        if(data["help"])
            buffer += "help:\n"+data["help"]+"\n";

        buffer += "main:\n"+data["main"];
    }

    const ref = Queue("readwrite");
    await writeToFile(path, {user, force, type:"Rewrite"}, encodeValue(buffer), await ref.open());
    ref.close();
}

