/** /Terminal/Bios
 * 
 * @author Alex Malotky
 */
import * as Keyboard from "./Keyboard";
import * as Mouse from './Mouse';
import * as Default from './Defaults';

const RATIO = 0.6;

export interface ViewTemplate {
    top: number,
    size: {
        width: number
        height: number
    },
    font: {
        width: number
        height: number
        color: string
        size: string
    },
    background: {
        color: string
    }
}

const OverrideKeys:Keyboard.KeyCode[] = [
    "Backspace",
    "ArrowUp", 
    "ArrowDown",
]

export type BiosType = ReturnType<typeof Bios>;
export default function Bios(target:HTMLElement) {

    /////// Elements that interact with bios ///////
    const canvas = document.createElement("canvas");
    canvas.tabIndex = 1;
    const gl = canvas.getContext("2d", {alpha: false})!;
    if(gl === null)
        throw new Error("Unable to Initalize 2D Context!");
    target.appendChild(canvas);

    /////// Environment Variables modified by user. ///////
    let backgroundColor: string = Default.COLOR_BACKGROUND;
    let fontColor:string = Default.COLOR_FONT;
    let width:number = Default.SCREEN_WIDTH;
    let height:number = Default.SCREEN_HEIGHT;

    ////// Environment Variable modified by bios. ///////
    let charWidth:number = Default.FONT_SIZE * RATIO;
    let charHeight:number = Default.FONT_SIZE;
    let fontFace:string = `${Default.FONT_SIZE}px monospace`;
    let x:number = 0;
    let y:number = 0;
    let growHeight:number = height;

    //////////////// Modify Environment ///////////////////
    target.setAttribute("width",  (width * charWidth).toString());
    target.setAttribute("height", (height * charHeight).toString());
    target.style.width  = `${width * charWidth}px`;
    target.style.height = `${height * charHeight}px`;
    canvas.width  = width * charWidth;
    canvas.height = height * charHeight;

    //////////////// Event Listeners ////////////////////
    canvas.addEventListener("keyup", async(e)=>Keyboard.reportKeyUp(e));
    canvas.addEventListener("keydown", async(e)=>{
        const code = Keyboard.reportKeyDown(e);
        if(OverrideKeys.includes(code)) {
            e.preventDefault();
            target.dispatchEvent(new CustomEvent("input", {detail: code}));
        }
    });

    canvas.addEventListener("keypress", async(e)=>{
        target.dispatchEvent(new CustomEvent("input", {detail: e.key}));
    });

    ///////////////// Private Functions //////////////////

    /** Clear Canvas for Redraw
     * 
     */
    function clear(): void {
        gl.fillStyle = backgroundColor;
        gl.fillRect( 0, 0, canvas.width, canvas.height);
        x = 0;
        y = 0;
    }

    function grow(): void {
        if(y > growHeight) {
            growHeight += height;
            canvas.height = growHeight * charHeight;
        }
    }

    /** Render Function Loop
     * 
     */
    function render() {
        clear();
        target.dispatchEvent(new CustomEvent("render"));
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    /////////////////// Bios Object ////////////////////////
    return {
        //////////////// Gets / Setters ////////////////////

        /** Character Size in Px
         * 
         */
        set size(value:number) {
            fontFace = `${value}px monospace`;
            charWidth = value * RATIO;
            charHeight = value;
        },
        get size():number {
            return charHeight;
        },

        /** Termanal Width in Ch
         * 
         */
        set width(value:number) {
            width = value;
            value *= charWidth;
            target.setAttribute("width", value.toString());
            target.style.width = `${value}px`;

        },
        get width():number {
            return width;
        },

        /** Terminal Height in Ch
         * 
         */
        set height(value:number){
            height = value;
            value *= charHeight;
            target.setAttribute("height", value.toString());
            target.style.height = `${value}px`
        },
        get height():number {
            return height;
        },

        get x() {
            return x;
        },
        get y() {
            return y;
        },

        //////////////////// Public Functions ///////////////////////////

        /** Put Single Character
         * 
         * @param {number} x 
         * @param {number} y 
         * @param {string} c 
         */
        put(x:number, y:number, c:string) {
            gl.fillStyle = fontColor;
            gl.font = fontFace;
            gl.fillText(c.charAt(0), (x+1)*charWidth, (y+2)*charHeight)
        },

        /** Print String
         * 
         * @param {string} s 
         */
        print(s:string){
            for(let i=0; i<s.length; i++) {
                let char = s.charAt(i);
                if(char == '\n' || char == '\r') {
                    x = 0;
                    y++;

                } else {
                    this.put(x, y, char);
                    x++;

                    if(x > this.width) {
                        x = 0;
                        y++;
                    }
    
                    grow();
                }
            }
        },

        /** Scroll to y-axis
         * 
         * @param targetHeight 
         */
        scroll(targetHeight:number){
            window.setTimeout(()=>target.scrollTop = (targetHeight + 2) * charHeight, 10);
        },

        /** Makes sure their is enough height for a new viewport
         * 
         * @returns y-axis top of view
         */
        /*public view(): ViewTemplate{
            let top = (this.y-1) * this._charHeight;

            this.y += this.height;
            this.x = 1;

            if(this.y >= this.totalHeight())
                this.grow();

            //Have to wait for the growth to render.
            window.setTimeout(()=>this._target.scrollTop = top+2, 10);

            this._gl.fillStyle = this._backgroundColor;
            this._gl.fillRect( 0, top+1, this._gl.canvas.width, this._gl.canvas.height);
            this._gl.fillStyle = this._fontColor;

            return {
                top: top,
                size: {
                    width: this._width,
                    height: this._height
                },
                font: {
                    width: this._charWidth,
                    height: this._charHeight,
                    color: this._fontColor,
                    size: this._charHeight,
                    string: this._gl.font
                },
                background: {
                    color: this._backgroundColor
                }
            };
        },*/

        /** Redner View
         * 
         * @param {View} v 
         */
        /* render(v: View){
            this._gl.putImageData(v.render(), 0, v.top);
        }*/
    }
}