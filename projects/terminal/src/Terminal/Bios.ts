/** /Terminal/Bios
 * 
 * @author Alex Malotky
 */
import Keyboard, {KeyCode, KeyboardType} from "./Keyboard";
import Mouse, {Position, Dimensions, getButton, MouseType} from './Mouse';
import * as Default from './Defaults';

const RATIO = 0.6;
const Y_OFFSET = 5;

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

const OverrideKeys:KeyCode[] = [
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
    const char:Dimensions = {
        width: Default.FONT_SIZE * RATIO,
        height: Default.FONT_SIZE
    }
    let fontFace:string = `${Default.FONT_SIZE-1}px monospace`;
    let x:number = 0;
    let y:number = 0;
    let growHeight:number = height;
    let highlightMap:[Position, Position]|[] = [];

    //////////////// Modify Environment ///////////////////
    target.style.width  = `${width * char.width}px`;
    target.style.height = `${(height * char.height)+Y_OFFSET+10}px`;
    canvas.width  = width * char.width;
    canvas.height = (height * char.height)+Y_OFFSET;

    //////////////// UI Helpers ///////////////////////////
    const keyboard = Keyboard();
    const mouse = Mouse(char);

    //////////////// Event Listeners ////////////////////
    canvas.addEventListener("keyup", (e)=>keyboard.reportKeyUp(e));
    canvas.addEventListener("keydown", (e)=>{
        const code = keyboard.reportKeyDown(e);
        if(OverrideKeys.includes(code)) {
            e.preventDefault();
            target.dispatchEvent(new CustomEvent("keyboard", {detail: code}));
        }
    });
    canvas.addEventListener("keypress", (e)=>{
        target.dispatchEvent(new CustomEvent("keyboard", {detail: e.key}));
    });

    canvas.addEventListener("mousedown", (e)=>{
        mouse.reportMouseDown(e);
        target.dispatchEvent(new CustomEvent("mouse", {detail: getButton(e.button)}))
    });
    canvas.addEventListener("mousemove", (e)=>{
        highlightMap = mouse.reportMouseMove(e);
    });
    canvas.addEventListener("mouseup", (e)=>{
        highlightMap = mouse.reportMouseUp(e);
    })

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
        if(y >= growHeight) {
            growHeight += height;
            canvas.height = growHeight * char.height;
            scroll();
        }
    }

    /** Scroll to y-axis
    * 
    * @param {number} targetHeight 
    */
    function scroll(targetHeight:number = y){
        if(targetHeight < 0 || targetHeight >= growHeight)
            return;

        const top    = Math.floor((target.scrollTop) / char.height);
        const bottom = Math.floor((target.scrollTop + target.clientHeight) / char.height);
        console.debug(top, bottom);
        if(targetHeight < top || targetHeight > bottom){
            window.setTimeout(()=>{
                target.scrollTop = ((targetHeight - height + 1) * char.height) + Y_OFFSET;
            }, 10);
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
            fontFace = `${value-1}px monospace`;
            char.width = value * RATIO;
            char.height = value;
        },
        get size():number {
            return char.height;
        },

        /** Termanal Width in Ch
         * 
         */
        set width(value:number) {
            width = value;
            value *= char.width;
            target.style.width = `${value}px`;
            canvas.width = value;

        },
        get width():number {
            return width;
        },

        /** Terminal Height in Ch
         * 
         */
        set height(value:number){
            height = value;
            value *= char.height;
            target.style.height = `${value+10}px`
            canvas.height = height;
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

        get KeyBoard():KeyboardType {
            return keyboard
        },

        get Mouse():MouseType {
            return mouse
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
            gl.fillText(c.charAt(0), (x+1)*char.width, ((y+1)*char.height)+Y_OFFSET)
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
                }
            }
            grow();
        },

        scroll,

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