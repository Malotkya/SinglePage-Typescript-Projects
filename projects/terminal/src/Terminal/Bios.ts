/** /Terminal/Bios
 * 
 * @author Alex Malotky
 */
import * as K from "./Keyboard";
import * as M from './Mouse';
import Settings, {SettingsMap, SettingsName, updateEvent} from './Settings';
import Color from "@/Color";
import Position, { normalizePositions, Dimensions } from "./Position";

const RATIO = 0.6;
export const Y_OFFSET = 5;
const HIGHLIGHT_OFFSET = 1;

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

export type HighlighMap = [Position, Position];

const OverrideKeys:K.KeyCode[] = [
    "Backspace",
    "ControlLeft",
    "ControlRight",
    "ArrowUp", 
    "ArrowDown",
]

interface RenderContext extends CanvasRenderingContext2D {
    interface: HTMLElement
}
let ctx:RenderContext|null = null;

/////// Environment Variables modified by user. ///////
let background:Color = Settings.backgroundColor;
let font:Color = Settings.fontColor;
let width:number = Settings.width;
let height:number = Settings.height;

////// Environment Variable modified by bios. ///////
const char:Dimensions = {
    width: Settings.fontSize * RATIO,
    height: Settings.fontSize
}
let fontFace:string = `${Settings.fontSize-1}px monospace`;
let x:number = 0;
let y:number = 0;
let growHeight:number = height;
let highlightMap:HighlighMap|null = null;
let scrollLocked:boolean = true;


//////////////// Event Listeners ////////////////////
export function claimBios(target:HTMLElement) {
    if(ctx !== null)
        throw new Error("Bios has already been claimed by another element!");

    const canvas = document.createElement("canvas");
    canvas.tabIndex = 1;

    const gl = canvas.getContext("2d", {alpha: false});
    if(ctx === null)
        throw new Error("Unable to Initalize 2D Context!");

    target.style.width  = `${width * char.width}px`;
    target.style.height = `${(height * (char.height+1))+Y_OFFSET+10}px`;
    canvas.width  = width * char.width;
    canvas.height = (height * (char.height+1))+Y_OFFSET;

    canvas.addEventListener("keyup", (e)=>K.reportKeyUp(e));
    canvas.addEventListener("keydown", (e)=>{
        const code = K.reportKeyDown(e);
        if(OverrideKeys.includes(code)) {
            e.preventDefault();
            target.dispatchEvent(new CustomEvent("keyboard", {detail: code}));
        }
    });
    canvas.addEventListener("keypress", (e)=>{
        target.dispatchEvent(new CustomEvent("keyboard", {detail: e.key}));
    });

    canvas.addEventListener("mousedown", (e)=>{
        M.reportMouseDown(e, char);
        target.dispatchEvent(new CustomEvent("mouse", {detail: M.getButton(e.button)}))
    });
    canvas.addEventListener("mousemove", (e)=>{
        const update = normalizePositions(M.reportMouseMove(e, char), {x, y});
        if(update)
            highlightMap = update;
    });
    canvas.addEventListener("mouseup", (e)=>{
        highlightMap = normalizePositions(M.reportMouseUp(e, char), {x, y});
    });

    target.addEventListener("scrollend", ()=>{
        scrollLocked = false;
        canvas.focus();
    });

    (gl as RenderContext).interface = target;
    ctx = gl as RenderContext;

    canvas.focus();
    render();

    return {
        get size():number {
            return char.height;
        },

        get width():number {
            return width;
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

        Mouse: {
            get position() {
                return M.position()
            },

            isButtonPressed(b:M.MouseButton) {
                return M.isButtonPressed(b)
            }
        },

        Keyboard: {
            isKeyPressed(code:K.KeyCode) {
                return K.isKeyPressed(code);
            }
        },

        get highlight():HighlighMap|null {
            return highlightMap
        },

        put, print, scroll, cursor
    }
}
export type BiosType = ReturnType<typeof claimBios>

///////////////// Private Functions //////////////////

/** Clear Canvas for Redraw
 * 
 */
function clear(): void {
    ctx!.fillStyle = background.toString();
    ctx!.fillRect( 0, 0, ctx!.canvas.width, ctx!.canvas.height);
    x = 0;
    y = 0;
}

/** Grow Canvas
 * 
 */
function grow(): void {
    if(y >= growHeight) {
        growHeight += height;
        ctx!.canvas.height = growHeight * (char.height+1);
    }
}

/** Inverse Section
 * 
 * @param {number} x
 * @param {number} y
 */
function inverse(x:number, y:number, stretch:boolean = true) {
    x = ((x+1)*char.width) - HIGHLIGHT_OFFSET;
    y = (y+1)*(char.height+1)-Y_OFFSET - HIGHLIGHT_OFFSET;

    const image = ctx!.getImageData(x, y, char.width, char.height+<any>stretch);

    for(let i=0; i<image.data.length; i+=4){
        if(background.equals(image.data[i], image.data[i+1], image.data[i+2])) {
            image.data[i]   = font.red;
            image.data[i+1] = font.green;
            image.data[i+2] = font.blue;
        } else {
            image.data[i]   = background.red;
            image.data[i+1] = background.green;
            image.data[i+2] = background.blue;
        }
    }

    ctx!.putImageData(image, x, y);
}

/** Highlight Based on Map
 * 
 */
function highlight(){
    if(highlightMap === null)
        return;

    const [start, end] = highlightMap;
    let y = start.y;
    if(y === end.y){
        for(let x = start.x; x<end.x; x++) {
            inverse(x, y);
        }
    } else {
        for(let x = start.x; x < width; x++) {
            inverse(x, y);
        }
        while(++y < end.y) {
            for(let x = 0; x< width; x++){
                inverse(x, y);
            }
        }
        for(let x = 0; x<end.x; x++) {
            inverse(x, y);
        }
    }
}

/** Render Function Loop
 * 
 */
function render() {
    clear();
    if(ctx!.interface.dispatchEvent(new CustomEvent("render"))){
        highlight();
    }
    requestAnimationFrame(render);
}

//////////////// Gets / Setters ////////////////////
updateEvent(function update<N extends SettingsName>(name:N, value:SettingsMap[N]){
    if(ctx === null)
        throw new Error("Bio is not yet claimed!");
        

    switch(name){
        case "font-size":
            fontFace = `${value as number-1}px monospace`;
            char.width = value as number * RATIO;
            char.height = value as number;
            break;

        case "width":
            width = value as number;
            (value as number) *= char.width;
            ctx.interface.style.width = `${value}px`;
            ctx.canvas.width = value as number;
            break;

        case "height":
            height = value as number;
            (value as number) *= char.height;
            ctx.interface.style.height = `${value as number + 10}px`;
            ctx.canvas.height = value as number;
            break;

        case "background-color":
            background = value as Color;
            break;

        case "font-color":
            font = value as Color;
            break;
    }
});

//////////////////// Public Functions ///////////////////////////

/** Put Single Character
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {string} c 
 */
export function put(x:number, y:number, c:string) {
    if(ctx === null)
        throw new Error("Bio is not yet claimed!");

    ctx.fillStyle = font.toString();
    ctx.font = fontFace;
    ctx.fillText(c.charAt(0), (x+1)*char.width, ((y+1)*(char.height+1))+Y_OFFSET)
}

/** Print String
 * 
 * @param {string} s 
 */
export function print(s:string){
    for(let i=0; i<s.length; i++) {
        let char = s.charAt(i);
        if(char == '\n' || char == '\r') {
            x = 0;
            y++;

        } else {
            put(x, y, char);
            x++;

            if(x > width) {
                x = 0;
                y++;
            }
        }
    }
    grow();
}

export function cursor(cx:number = x, cy:number = y) {
    inverse(cx, cy, false);
}

/** Scroll to y-axis
* 
* @param {number} targetHeight 
*/
export function scroll(targetHeight:number = y, override:boolean = scrollLocked){
    if(ctx === null)
        throw new Error("Bios is not connected!");

    if(targetHeight < 0 || targetHeight >= growHeight || override === false)
        return;

    const top    = Math.floor((ctx.interface.scrollTop) / (char.height+1));
    const bottom = Math.floor((ctx.interface.scrollTop + ctx.interface.clientHeight) / (char.height+1))-2;
    if(targetHeight < top || targetHeight > bottom){
        /*window.setTimeout(()=>{
            if(element)
                
        }, 10);*/
        ctx.interface.scrollTop = ((targetHeight - height + 2) * (char.height+1)) + Y_OFFSET;
    }
    scrollLocked = true;
}

    

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
