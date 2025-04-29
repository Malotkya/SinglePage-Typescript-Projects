/** /Terminal/App
 * 
 * @author Alex Malotky
 */
import History from "./History";
import System, { Process, HelpFunction, MainFunction, validateCall} from ".";

export default class App implements Process{
    private _call: string;
    private _description: string;
    #main: MainFunction|undefined;
    #help: HelpFunction|undefined;
    readonly history: History<string>;

    constructor(call: string, description: string){
        this._call = call.toLowerCase();
        this._description = description;
        this.history = new History(this._call);
    }

    set main(value:MainFunction){
        if(typeof value !== "function")
            throw new TypeError("Main Function must be a function!");

        this.#main = value;
    }

    get main():MainFunction {
        if(this.#main === undefined)
            throw new Error(`Main funciton never set for ${this._call}!`);

        return this.#main;
    }

    set help(value:HelpFunction){
        if(typeof value !== "function")
            throw new TypeError("Help Function must be a function!");
        
        this.#help = value;
    }

    get help():HelpFunction {
        if(this.#help === undefined)
            throw new Error(`Help funciton never set for ${this._call}!`);

        return this.#help;
    }

    get call(){
        return this._call;
    }
    get description(){
        return this._description;
    }
}

export type FileData = Record<string, string>;

function buildScript(data:string):Function {
    return new Function(`return (async(System, args)=>{
        ${data}
    })(arguments[1], arguments[2])`)
}

export function fromFile(data:FileData):Process {
    const history:string = data["history"]? data["history"].toLocaleLowerCase().trim(): "";
    const call:string = validateCall(data["name"]);
    const help:Function|undefined = data["help"]? buildScript(data["help"]): undefined;
    const description:string|undefined = data["description"];
    const string:string|undefined = data["main"] || data["*"];
    
    if(typeof string !== "string")
        throw new Error("Main function missing");

    const main = buildScript(string);
    
    return {
        call, description,
        history: history === "true" || history === "1"? new History(call): undefined,
        main: (args)=>main(System, args),
        help: help? ()=>help(System): undefined
    }
}

