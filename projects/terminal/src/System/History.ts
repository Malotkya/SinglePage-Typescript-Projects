/** /System/History
 * 
 * @author Alex Malotky
 */
import fs from "./File";
import {Path} from "./Kernel";

export default class History {
    private list:string[];
    private _index:number;
    private _path:string;

    constructor(id:string) {
        this._path = Path.join("~", "history", id);
        fs.mkfile(this._path, {recursive: true, soft: true});
        this.list = [];
        this._index = -1;
        this.init();
    }

    async init() {
        try {
            this.list = (await fs.readfile(this._path)).Text("utf-8").split("\n");
            this._index = this.list.length;
        } catch (e){
            //Do Nothing
        }
        
    }

    clear() {
        this.list = [];
        this._index = -1;
        fs.writefile(this._path, "", {type: "Override"});
    }

    add(value:string) {
        this.list.push(value);
        this._index = this.list.length;
        fs.writefile(this._path, value+"\n", {type: "Append"});
    }

    at(index:number):string|undefined{
        return this.list[index];
    }

    get current():string{
        return this.list[this._index] || "";
    }

    get index():number {
        return this._index;
    }

    set index(value:number) {
        if(value < 0)
            this._index = 0;
        else if(value >= this.list.length)
            this._index = this.list.length-1;
        else
            this._index = value;
    }
}