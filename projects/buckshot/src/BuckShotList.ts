/** Buckshot List
 * 
 * @author Alex Malotky
 */
import BuckshotElement from "./Buckshot";

/** Buckshot List Element
 * 
 * @author Alex Malotky
 */
export default class BuckshotListElement extends HTMLElement{
    private _list:Array<BuckshotElement>;
    private _live:number;
    private _blank:number;

    /** Constructor
     * 
     * @param {number} live 
     * @param {number} blank 
     */
    constructor(live:number, blank:number){
        super();
        this.role = "list";
        this._live = live;
        this._blank = blank;
        this._list = [];
        this.init();

        /** List Change Handler
         * 
         */
        this.addEventListener("change", (event)=>{
            const target = <BuckshotElement>event.target;
            const {blank, live} = this.getCounts();

            //Reset if invalid change
            if(target.isBlank() && blank < 0) {
                target.reset();
            } else if(target.isLive() && live < 0) {
                target.reset();
            }

            //Update if First Element Selected
            if(this._list[0] === target){
                while(this._list[0] && !this._list[0].isUnknown()) {
                    this._list.shift()!.value = "";
                }

                //Update or dispatch empty event.
                if(this._list.length === 0){
                    this.dispatchEvent(new CustomEvent("emptied", {bubbles: true}));
                } else {
                    this.udpate();
                }
                
            } else if(target.isUnknown()){
                //Re-add to list if not included
                if( !this._list.includes(target))
                    this._list.unshift(target);

                this.udpate();
            }
        });
    }

    /** Get Current Counts
     * 
     * @returns {Object}
     */
    private getCounts():{live:number, blank:number}{
        let live = this._live;
        let blank = this._blank;

        for(let i=0; i<this.children.length; i++){
            const shot = <BuckshotElement>this.children[i];

            if(shot.isLive()) {
                --live;
            } else if(shot.isBlank()) {
                --blank;
            }
        }

        return {blank, live};
    }

    /** Update List Indexes
     * 
     */
    private udpate(){
        let i=0;
        while(i < this._list.length) {
            this._list[i].value = String(++i);
        }
    }

    /** Live Count Getter
     * 
     */
    get liveCount():number {
        return this._live;
    }

    /** Live Count Setter
     * 
     */
    set liveCount(value:number) {
        if(isNaN(value) || value < 0)
            value = 0;

        this._live = value;
    }

    /** Blank Count Getter
     * 
     */
    get blankCount():number {
        return this._blank;
    }

    /** Blank Count Setter
     * 
     */
    set blankCount(value:number) {
        if(isNaN(value) || value < 0)
            value = 0;

        this._blank = value;
    }

    /** Size Getter
     * 
     */
    get size():number {
        return this._live + this._blank;
    }

    /** Init List
     * 
     */
    init(){
        this._list = [];
        this.innerHTML = "";

        let i=0;
        while(i < this.size) {
            const shot = new BuckshotElement(++i);
            this._list.push(shot);
            this.appendChild(shot);
        }
    }

    /** Chance Getter
     * 
     * @returns {number}
     */
    chance():number {
        const {blank, live} = this.getCounts();
        const count = blank + live;

        if(count <= 0)
            return 0;
        
        return live / count;
    }
}

customElements.define("shot-list", BuckshotListElement)