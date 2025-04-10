/** /Terminal/App
 * 
 * @author Alex Malotky
 */


export type MainFunction = (args:string[])=>Promise<void>|void;
export type HelpFunction = ()=>Promise<void>|void;

export default class App{
    private _call: string;
    private _description: string;
    private _history: string[];
    private _location:number;
    #main: MainFunction|undefined;
    #help: HelpFunction|undefined;

    constructor(call: string, description: string){
        this._call = call.toLowerCase();
        this._description = description;
        this._history = [];
        this._location = -1;
    }

    public moveHistory(it: number){
        if(this._history.length > 0) {
            this._location += it;

            if(this._location < 0) {
                this._location = 0;
            }

            if(this._location >= this._history.length) {
                this._location = this._history.length-1;
            }

            return this._history[this._location];
        }

        return undefined;
    }

    protected addToHistory(s:string){
        this._history.push(s);
        this._location = this._history.length;
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