/** Color.ts
 * 
 * @author Alex Malotky
 */

/** Color Helper Class
 * 
 */
export default class Color {
    private _r:number;
    private _g:number;
    private _b:number;

    constructor(red:number, green:number, blue:number) {
        if(red < 0)
            this._r = 0;
        else if(red > 255)
            this._r = 255;
        else
            this._r = red;

        if(green < 0)
            this._g = 0;
        else if(green > 255)
            this._g = 255;
        else
            this._g = green;

        if(blue < 0)
            this._b = 0;
        else if(blue > 255)
            this._b = 255;
        else
            this._b = blue;
    }

    get red():number {
        return this._r;
    }
    set red(value:number){
        if(value < 0)
            this._r = 0;
        else if(value > 255)
            this._r = 255;
        else
            this._r = value;
    }

    get green():number {
        return this._g;
    }
    set green(value:number){
        if(value < 0)
            this._g = 0;
        else if(value > 255)
            this._g = 255;
        else
            this._g = value;
    }

    get blue():number {
        return this._b;
    }
    set blue(value:number){
        if(value < 0)
            this._b = 0;
        else if(value > 255)
            this._b = 255;
        else
            this._b = value;
    }

    toString():string {
        return "#" + toHex(this._r) + toHex(this._g) + toHex(this._b);
    }

    /** Color From String
     * 
     * @param {string} value 
     * @returns {Color}
     */
    static from(value:string):Color {
        if(value.at(0) === "#")
            value = value.substring(1);

        if(value.length === 3){
            return new Color(parseInt(value[0], 16), parseInt(value[1], 16), parseInt(value[2], 16))
        } else if(value.length < 6) {
            throw new TypeError("Malformed color string!");
        }

        return new Color(
            parseInt(value.substring(0, 2), 16),
            parseInt(value.substring(2, 2), 16),
            parseInt(value.substring(4, 2), 16)
        )
    }

    equals(c:Color):boolean
    equals(r:number, g:number, b:number):boolean
    equals(r:Color|number, g:number = 0, b:number = 0):boolean{
        if(r instanceof Color)
            return this._r === r._r && this._g === r._g && this._b === r._b;

        return this._r === r && this._g === g && this._b === b;
    }
}

const toHex = (n:number) => `0${n.toString(16)}`.slice(-2); 