/** Index Tracker List
 * 
 * @author Alex Malotky
 */
export default class IndexList<T> {
    private list:T[];
    private _index:number;

    constructor() {
        this.list = [];
        this._index = -1;
    }

    clear() {
        this.list = [];
        this._index = -1;
    }

    add(value:T) {
        this._index = this.list.length;
        this.list.push(value);
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