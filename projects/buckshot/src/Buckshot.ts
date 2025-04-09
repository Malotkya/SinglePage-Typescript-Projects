/** Buckshot
 * 
 * @author Alex Malotky
 */
import { createElement as _ } from "@/Element";

/** Buckshot Element
 * 
 */
export default class BuckshotElement extends HTMLElement {
    private _view:HTMLElement;
    private _value:HTMLElement;

    /** Constructor
     * 
     * @param {string|number} value 
     */
    constructor(value:string|number|null = null) {
        super();
        this.role = "list-item";
        
        this._view = _("div", {class: "view"});
        this._value = _("div", {class: "value"}, value);

        /** Reset Event Handler
         * 
         */
        this._view.addEventListener("click", (event)=>{
            if(!this.isUnknown()){
                this.reset();
            }
        })

        this.appendChild(this._value);
        this.appendChild(this._view);
        this.reset();
    }

    /** Flip State
     * 
     */
    flip(){
        this.set(!this.isBlank());
    }

    /** Set State
     * 
     * @param {boolean} value 
     */
    set(value:boolean){
        this.className = value? "live": "blank";
        this._view.textContent = value? "Live": "Blank";

        this.dispatchEvent(new CustomEvent("change", {bubbles: true}));
    }

    /** Reset State
     * 
     */
    reset() {
        this._view.innerHTML = "";
        this.className = "";

        const btnLive = _("button", {class: "live"}, "Live");
        const btnBlank = _("button", {class: "blank"}, "Blank");

        /** Live Event Listener
         * 
         */
        btnLive.addEventListener("click", (event)=>{
            event.stopPropagation();
            this.set(true);
        });

        /** Blank Event Listener
         * 
         */
        btnBlank.addEventListener("click", (event)=>{
            event.stopPropagation();
            this.set(false);
        });

        this._view.appendChild(btnLive);
        this._view.appendChild(btnBlank);
        
        this.dispatchEvent(new CustomEvent("change", {bubbles: true}));
    }

    /** Is Live
     * 
     * @returns {boolean}
     */
    isLive():boolean {
        return this.className.includes("live");
    }

    /** Is Blank
     * 
     * @returns {boolean}
     */
    isBlank():boolean {
        return this.className.includes("blank");
    }

    /** Is Unknown
     * 
     * @returns {boolean}
     */
    isUnknown():boolean {
        return this.className === "";
    }

    /** Value Getter
     * 
     */
    get value():string {
        return this._value.textContent!;
    }

    /** Value Setter
     * 
     */
    set value(value:string){
        this._value.textContent = value;
        if(this._value.parentElement !== this) {
            if(value !== "") {
                this.insertBefore(this._value, this._view);
            }
        } else {
            if(value === ""){
                this.removeChild(this._value);
            }
        }
            
    }
}

customElements.define("shot-item", BuckshotElement);