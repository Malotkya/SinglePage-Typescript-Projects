/** /Terminal/History
 * 
 * @author Alex Malotky
 */
import Destroyable, { addToCleanup } from "./CleanUp";

export default class History<T> implements Destroyable{
    private list:T[];
    private _index:number;
    private _id:string;

    constructor(id:string) {
        this._id = "History:"+id;

        try {
            this.list = JSON.parse(localStorage.getItem(this._id) || "");

            if(!Array.isArray(this.list))
                throw "Not a list!";

            this._index = this.list.length;
        } catch (e){
            this.list = [];
            this._index = -1;
        }

        addToCleanup(this);
    }

    destroy() {
        localStorage.setItem(this._id, JSON.stringify(this.list));
    }

    clear() {
        this.list = [];
        this._index = -1;
    }

    add(value:T) {
        this.list.push(value);
        this._index = this.list.length;
    }

    at(index:number):T|undefined{
        return this.list[index];
    }

    get current():T{
        return this.list[this._index];
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