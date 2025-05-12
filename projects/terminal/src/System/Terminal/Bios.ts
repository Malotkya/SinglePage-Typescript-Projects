/** /System/Terminal/Bios
 * 
 * @author Alex Malotky
 */
import * as K from "./Keyboard";
import * as M from './Mouse';
import Color from "@/Color";
import Position, { normalizePositions, Dimensions } from "./Position";
import {BiosView, ViewTemplate} from "./View";
import PixelMatrix from "./PixelMatrix";
import Encoding from "../Files/Encoding";

const RATIO = 0.6;
export const Y_OFFSET = 5;
const INTERFACE_OFFSET = 10;
export const HIGHLIGHT_OFFSET = 1;

export type HighlighMap = [Position, Position];

interface RenderContext extends CanvasRenderingContext2D, Dimensions {
    readonly interface: HTMLElement
    backgroundColor: Color
    fontColor: Color
    fontFace: string
    fontSize: number
    char: Dimensions
}

let ctx:RenderContext|null = null;
let view:BiosView|null = null;

/////// Environment Variables modified by user. ///////


////// Environment Variable modified by bios. ///////
let highlightMap:HighlighMap|null = null;
let scrollLocked:boolean = true;
let x:number = 0;
let y:number = 0;
let growHeight:number = 0;


//////////////// Event Listeners ////////////////////

interface BiosInitData extends Dimensions{
    backgroundColor:Color,
    fontColor:Color
    fontSize:number
}

/** Claim Bios
 * 
 * Takes claim of bios if it can, and integrates the given interface with a canvas.
 * 
 * Returns helper interface to make interacting with the bios easier.
 * 
 * @param {HTMLElement} target 
 * @returns {BiosType}
 */
export function claimBios(target:HTMLElement, data:BiosInitData) {
    if(ctx !== null)
        throw new Error("Bios has already been claimed by another element!");

    const canvas = document.createElement("canvas");
    canvas.tabIndex = 1;

    const gl = canvas.getContext("2d", {alpha: false}) as RenderContext;
    if(gl === null)
        throw new Error("Unable to Initalize 2D Context!");

    canvas.addEventListener("keyup", (e)=>K.reportKeyUp(e));
    canvas.addEventListener("keydown", (e)=>{
        e.preventDefault();
        const data = K.reportKeyDown(e);
        if(data.key === "Space") {
            data.value = " ";
        } else if(data.value.length > 1) {
            data.value = "";
        }

        target.dispatchEvent(new CustomEvent("keyboard", {detail: data}));
    });

    canvas.addEventListener("mousedown", (e)=>{
        M.reportMouseDown(e, ctx!.char);
        target.dispatchEvent(new CustomEvent("mouse", {detail: M.getButton(e.button)}))
    });
    canvas.addEventListener("mousemove", (e)=>{
        const update = normalizePositions(M.reportMouseMove(e, ctx!.char), {x, y});
        if(update)
            highlightMap = update;
    });
    canvas.addEventListener("mouseup", (e)=>{
        highlightMap = normalizePositions(M.reportMouseUp(e, ctx!.char), {x, y});
    });

    target.addEventListener("scrollend", ()=>{
        scrollLocked = false;
        canvas.focus();
    });

    const {width, height, fontSize, fontColor, backgroundColor} = data;

    growHeight = Math.max(growHeight, height);
    const char:Dimensions = {
        width: fontSize * RATIO,
        height: fontSize
    };

    
    (gl as any).interface = target;
    gl.char = char;
    gl.width = width;
    gl.height = height;
    gl.backgroundColor = backgroundColor;
    gl.fontColor = fontColor;
    gl.fontSize = fontSize;
    gl.fontFace = `${fontSize-1}px monospace`;

    const w = width * char.width;
    const h = height * char.height+Y_OFFSET;
    gl.interface.style.width = `${w}px`;
    gl.canvas.width = w;
    gl.interface.style.height = `${h+INTERFACE_OFFSET}px`;
    gl.canvas.height = h;

    ctx = gl;

    target.appendChild(canvas);
    canvas.focus();
    render();

    return {

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
        } satisfies M.MouseType,

        Keyboard: {
            isKeyPressed(code:K.KeyCode) {
                return K.isKeyPressed(code);
            }
        } satisfies K.KeyboardType,

        get highlight():HighlighMap|null {
            return highlightMap
        },

        get width():number{
            return ctx?.width || 0;
        },

        set width(value:number){
            if(ctx){
                ctx.width = value;
                value *= ctx.char.width;
                ctx.interface.style.width = `${value}px`;
                ctx.canvas.width = value;
            }
        },

        get height():number {
            return ctx?.height || 0;
        },

        set height(value:number){
            if(ctx){
                ctx.height = value;
                value *= ctx.char.height;
                ctx.interface.style.height = `${value+INTERFACE_OFFSET}px`;
                ctx.canvas.height = value;
            }
        },

        get background():Color {
            return ctx?.backgroundColor || new Color(0, 0, 0);
        },

        set background(value:Color) {
            if(ctx)
                ctx.backgroundColor = value;
        },

        get font():Color {
            return ctx?.fontColor || new Color(0, 0, 0);
        },

        set font(value:Color){
            if(ctx)
                ctx.fontColor = value;
        },

        get size():number {
            return ctx?.fontSize || 0;
        },

        set size(value:number){
            if(ctx){
                ctx.fontSize = value;
                ctx.fontFace = `${value-1}px monospace`;
                ctx.char.width = value * RATIO;
                ctx.char.height = value;
                const w = ctx.width * ctx.char.width;
                const h = ctx.height * ctx.char.height+Y_OFFSET;
                ctx.interface.style.width = `${w}px`;
                ctx.canvas.width = w;
                ctx.interface.style.height = `${h+INTERFACE_OFFSET}px`;
                ctx.canvas.height = h;
            }
        },

        put, print, scroll, cursor
    }
}
export type BiosType = ReturnType<typeof claimBios>

/** Release Bios
 * 
 * @param target 
 */
export function releaseBio(target:HTMLElement) {
    if(ctx?.interface === target) {
        if(view !== null)
            throw new Error("Unable to release bios when View is being used!");

        ctx = null;
    }
}

///////////////// Private Functions //////////////////

/** Clear Canvas for Redraw
 * 
 */
function clear(): void {
    ctx!.fillStyle = ctx!.backgroundColor.toString();
    ctx!.fillRect( 0, 0, ctx!.canvas.width, ctx!.canvas.height);
    x = 0;
    y = 0;
}

/** Grow Canvas
 * 
 */
function grow(): void {
    if(y >= growHeight) {
        growHeight += ctx!.height;
        ctx!.canvas.height = growHeight * ctx!.char.height;
    }
}

/** Inverse Section
 * 
 * @param {number} x
 * @param {number} y
 */
function inverse(x:number, y:number) {
    x = ((x+1)*ctx!.char.width) - HIGHLIGHT_OFFSET;
    y = ((y+1)*ctx!.char.height)- Y_OFFSET - HIGHLIGHT_OFFSET;

    const image = ctx!.getImageData(x, y, ctx!.char.width, ctx!.char.height);

    for(let i=0; i<image.data.length; i+=4){
        if(ctx!.backgroundColor.equals(image.data[i], image.data[i+1], image.data[i+2])) {
            image.data[i]   = ctx!.fontColor.red;
            image.data[i+1] = ctx!.fontColor.green;
            image.data[i+2] = ctx!.fontColor.blue;
        } else {
            image.data[i]   = ctx!.backgroundColor.red;
            image.data[i+1] = ctx!.backgroundColor.green;
            image.data[i+2] = ctx!.backgroundColor.blue;
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
        for(let x = start.x; x < ctx!.width; x++) {
            inverse(x, y);
        }
        while(++y < end.y) {
            for(let x = 0; x< ctx!.width; x++){
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
    if(ctx!.interface.dispatchEvent(new CustomEvent("render", {cancelable: true}))){
        highlight();
    }
    requestAnimationFrame(render);
}

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

    ctx.fillStyle = ctx!.fontColor.toString();
    ctx.font = ctx!.fontFace;
    ctx.fillText(c.charAt(0), (x+1)*ctx!.char.width, ((y+1)*ctx!.char.height)+Y_OFFSET)
}

/** Print String
 * 
 * @param {string} s 
 */
export function print(s:string){
    if(ctx === null)
        throw new Error("Bio is not yet claimed!");

    for(let i=0; i<s.length; i++) {
        let char = s.charAt(i);
        if(char == '\n' || char == '\r') {
            x = 0;
            y++;

        } else {
            put(x, y, char);
            x++;

            if(x > ctx!.width) {
                x = 0;
                y++;
            }
        }
    }
    grow();
}

export function cursor(cx:number = 0, cy:number = 0) {
    if(ctx === null)
        throw new Error("Bio is not yet claimed!");

    x += cx;
    y += cy;

    while(x < 0){
        x += ctx!.width;
        y--;
    }

    while(x > ctx!.width){
        x -= ctx!.width;
        y++;
    }

    inverse(x, y);
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

    const top    = Math.floor((ctx.interface.scrollTop) / ctx.char.height);
    const bottom = Math.floor((ctx.interface.scrollTop + ctx.interface.clientHeight) / ctx.char.height)-2;
    if(targetHeight < top || targetHeight > bottom){
        ctx.interface.scrollTop = ((targetHeight - ctx.height + 2) * ctx.char.height) + Y_OFFSET;
    }
    scrollLocked = true;
}

export type PixelFunction = (m:PixelMatrix)=>void;

/** Get View Data
 * 
 * @param {number} width
 * @param {number} height
 * @returns {Object}
*/
export function viewTemplate(): {template: ViewTemplate, init:(view:BiosView|null)=>void}
export function viewTemplate(width:number,  height:number): {template: ViewTemplate, init:(view:BiosView|null)=>void}
export function viewTemplate(w:number = ctx!.width * ctx!.char.width, h:number = ctx!.height * ctx!.char.height): {template: ViewTemplate, init:(view:BiosView|null)=>void}{
    if(ctx === null)
        throw new Error("Bio is not yet claimed!");
    
    if(w >= document.body.clientWidth)
        throw new Error("Width is to large!");

    if(h >= document.body.clientHeight)
        throw new Error("Height is to large!");

    clear();
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.interface.style.width = `${w}px`;
    ctx.interface.style.height = `${h+INTERFACE_OFFSET}px`;

    let size:Dimensions = JSON.parse(JSON.stringify(ctx!.char));
    return {
        init:(v:BiosView|null)=>{
            view = v
            if(v === null && ctx){
                const w = ctx.width * ctx.char.width;
                const h = (growHeight * ctx.char.height)+Y_OFFSET;

                ctx.canvas.width = w;
                ctx.canvas.height = h;
                ctx.interface.style.width = `${w}px`;
                ctx.interface.style.height = `${h+INTERFACE_OFFSET}px`;
            }
        },
        template: {
            font: {
                width: ctx!.char.width,
                height: ctx!.char.height,
                color: ctx!.fontColor
            },
            background: {
                color: ctx!.backgroundColor,
                width: w,
                height: h
            },
            mouse: {
                get position() {
                    return M.position()
                },
    
                isButtonPressed(b:M.MouseButton) {
                    return M.isButtonPressed(b)
                }
            } satisfies M.MouseType,
            keyboard: {
                isKeyPressed(code:K.KeyCode) {
                    return K.isKeyPressed(code);
                }
            } satisfies K.KeyboardType,
            ctx: {
                get fillColor() {
                    return Color.from(ctx!.fillStyle as string)
                },
                set fillColor(c:Color) {
                    ctx!.fillStyle = c.toString();
                },
                get fontSize() {
                    return size.height;
                },
                set fontSize(n:number){
                    size.height = n;
                    ctx!.font = `${n-1}px monospace`;
                },
                get fontWidth() {
                    return size.width;
                },
                set fontWidth(n:number){
                    size.width = n;
                    ctx!.letterSpacing = `${n - (size.height / 2)}px`;
                },
                get lineCap() {
                    return ctx!.lineCap
                },
                set lineCap(s:"butt"|"round"|"square") {
                    ctx!.lineCap = s;
                },
                get lineDashOffset() {
                    return ctx!.lineDashOffset
                },
                set lineDashOffset(n:number) {
                    ctx!.lineDashOffset = n;
                },
                get lineJoin() {
                    return ctx!.lineJoin
                },
                set lineJoin(s:"round"|"bevel"|"miter"){
                    ctx!.lineJoin = s;
                },
                get lineWidth(){
                    return ctx!.lineWidth;
                },
                set lineWidth(n:number){
                    ctx!.lineWidth = n;
                },
                get miterLimit(){
                    return ctx!.miterLimit;
                },
                set miterLimit(n:number){
                    ctx!.miterLimit = n;
                },
                get strokeStyle() {
                    return Color.from(ctx!.strokeStyle as string);
                },
                set strokeStyle(c:Color){
                    ctx!.strokeStyle = c.toString();
                },
                arc(x:number, y:number, radius:number, startAngle:number, endAngle:number, counterclockwise?:boolean){
                    ctx!.arc(x, y, radius, startAngle, endAngle, counterclockwise);
                }, 
                arcTo(x1:number, y1:number, x2:number, y2:number, radius:number){
                    ctx!.arcTo(x1, y1, x2, y2, radius);
                },
                beginPath(){
                    ctx!.beginPath();
                },
                clearRect(x:number, y:number, width:number, height:number){
                    ctx!.clearRect(x, y, width, height);
                }, 
                closePath(){
                    ctx!.closePath();
                },
                ellipse(x:number, y:number, radiusX:number, radiusY:number, rotation:number, startAngle:number, endAngle:number, counterclockwise?:boolean){
                    ctx!.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
                },
                fillRect(x:number, y:number, width:number, height:number){
                    ctx!.fillRect(x, y, width, height);
                }, 
                fillText(text:string, x:number, y:number, maxWidth?:number){
                    ctx!.fillText(text, x, y, maxWidth);
                },
                lineTo(x:number, y:number){
                    ctx!.lineTo(x, y);
                },
                moveTo(x:number, y:number){
                    ctx!.moveTo(x, y);
                }, 
                rect(x:number, y:number, width:number, height:number){
                    ctx!.rect(x, y, width, height);
                },
                roundRect(x:number, y:number, width:number, height:number, radii:number){
                    ctx!.roundRect(x, y, width, height, radii);
                },
                setLineDash(segments:number[]){
                    ctx!.setLineDash(segments);
                },
                stroke(){
                    ctx!.stroke();
                },
                strokeRect(x:number, y:number, width:number, height:number){
                    ctx!.strokeRect(x, y, width, height);
                }, 
                strokeText(text:string, x:number, y:number, maxWidth?:number){
                    ctx!.strokeText(text, x, y, maxWidth);
                },
                drawImage(x:number, y:number, image:Uint8Array|Encoding){
                    if(image instanceof Encoding)
                        image = image.Array(8);
        
                    const width:number  = (image[0] << 8) + image[1];
                    const height:number = (image[2] << 8)+ image[3];

                    this.accessPixels(x, y, width, height, (m)=>{
                        let offset = 4;
                        for(const p of m){
                            p.red = image[++offset];
                            p.green = image[++offset];
                            p.blue = image[++offset];
                        }
                    });
                },
                accessPixels(x:number|PixelFunction, y?:number, h?:number|PixelFunction, w?:number, func?:PixelFunction):void {
                    if(typeof x !== "number") {
                        func = x;
                        w = ctx!.canvas.width-1;
                        h = ctx!.canvas.height-1;
                        x = 0;
                        y = 0;
                    } else if(typeof h !== "number") {
                        w = x;
                        h = y;
                        x = 0;
                        y = 0;
                    }
                
                    if(typeof w !== "number" || typeof h !== "number" || typeof func !== "function")
                        throw new TypeError("Invaliad Arguments!");
                
                    if(x === undefined || x < 0 || x > w)
                        throw new TypeError("X is out of bounds!");
                
                    if(y === undefined || y < 0 || y > h)
                        throw new TypeError("Y is out of bounds!");
                
                    if(w < 1 || (w+x) > ctx!.canvas.width)
                        throw new TypeError("Width is out of bounds!");
                
                    if(h < 1 || (h+y) > ctx!.canvas.height)
                        throw new TypeError("Height is out of bounds!");
                
                    const image = ctx!.getImageData(x, y, w, h);
                    func(new PixelMatrix(image));
                    ctx!.putImageData(image, x, y);
                }
            }
        }
    };
}
