/** /Terminal/App
 * 
 * @author Alex Malotky
 */
import History from "./History";
import { Process, HelpFunction, MainFunction} from ".";

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
            throw new TypeError("Main Function must be a function!");
        
        this.#help = value;
    }

    get help():HelpFunction {
        if(this.#help === undefined)
            throw new Error(`Main funciton never set for ${this._call}!`);

        return this.#help;
    }

    get call(){
        return this._call;
    }
    get description(){
        return this._description;
    }
}