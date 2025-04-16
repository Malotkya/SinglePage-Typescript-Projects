/** /Terminal/Bios
 * 
 * @author Alex Malotky
 */
import * as K from "./Keyboard";
import * as M from './Mouse';
import Settings, {SettingsMap, SettingsName, updateEvent} from './Settings';
import Color from "@/Color";
import Position, { normalizePositions, Dimensions } from "./Position";
import {BiosView, ViewTemplate} from "./View";
import PixelMatrix from "./PixelMatrix";

const RATIO = 0.6;
export const Y_OFFSET = 5;
const INTERFACE_OFFSET = 10;
export const HIGHLIGHT_OFFSET = 1;


export type HighlighMap = [Position, Position];

interface RenderContext extends CanvasRenderingContext2D {
    readonly interface: HTMLElement
}

let ctx:RenderContext|null = null;
let view:BiosView|null = null;

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

/** Claim Bios
 * 
 * Takes claim of bios if it can, and integrates the given interface with a canvas.
 * 
 * Returns helper interface to make interacting with the bios easier.
 * 
 * @param {HTMLElement} target 
 * @returns {BiosType}
 */
export function claimBios(target:HTMLElement) {
    if(ctx !== null)
        throw new Error("Bios has already been claimed by another element!");

    const canvas = document.createElement("canvas");
    canvas.tabIndex = 1;

    const gl = canvas.getContext("2d", {alpha: false});
    if(gl === null)
        throw new Error("Unable to Initalize 2D Context!");

    target.style.width  = `${width * char.width}px`;
    target.style.height = `${(height * char.height)+Y_OFFSET+INTERFACE_OFFSET}px`;
    canvas.width  = width * char.width;
    canvas.height = (height * char.height)+Y_OFFSET;

    canvas.addEventListener("keyup", (e)=>K.reportKeyUp(e));
    canvas.addEventListener("keydown", (e)=>{
        const code = K.reportKeyDown(e);
        if(!code.includes("Key")) {
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

    (gl as any).interface = target;
    ctx = gl as RenderContext;

    target.appendChild(canvas);
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
        } satisfies M.MouseType,

        Keyboard: {
            isKeyPressed(code:K.KeyCode) {
                return K.isKeyPressed(code);
            }
        } satisfies K.KeyboardType,

        get highlight():HighlighMap|null {
            return highlightMap
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
        ctx!.canvas.height = growHeight * char.height;
    }
}

/** Inverse Section
 * 
 * @param {number} x
 * @param {number} y
 */
function inverse(x:number, y:number) {
    x = ((x+1)*char.width) - HIGHLIGHT_OFFSET;
    y = ((y+1)*char.height)- Y_OFFSET - HIGHLIGHT_OFFSET;

    const image = ctx!.getImageData(x, y, char.width, char.height);

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

    switch(name){
        case "font-size":
            fontFace = `${value as number-1}px monospace`;
            char.width = value as number * RATIO;
            char.height = value as number;
            if(ctx){
                const w = width * char.width;
                const h = (height * char.height)+Y_OFFSET;
                ctx.interface.style.width = `${w}px`;
                ctx.canvas.width = w;
                ctx.interface.style.height = `${h+INTERFACE_OFFSET}px`;
                ctx.canvas.height = h;
            }
            break;

        case "width":
            width = value as number;
            (value as number) *= char.width;
            if(ctx){
                ctx.interface.style.width = `${value}px`;
                ctx.canvas.width = value as number;
            }
            break;

        case "height":
            height = value as number;
            const v = (value as number * char.height)+Y_OFFSET;
            if(ctx){
                ctx.interface.style.height = `${v+INTERFACE_OFFSET}px`;
                ctx.canvas.height = v;
            }
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
    ctx.fillText(c.charAt(0), (x+1)*char.width, ((y+1)*char.height)+Y_OFFSET)
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

            if(x > width) {
                x = 0;
                y++;
            }
        }
    }
    grow();
}

export function cursor(cx:number = x, cy:number = y) {
    if(ctx === null)
        throw new Error("Bio is not yet claimed!");

    inverse(cx, cy);
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

    const top    = Math.floor((ctx.interface.scrollTop) / char.height);
    const bottom = Math.floor((ctx.interface.scrollTop + ctx.interface.clientHeight) / char.height)-2;
    if(targetHeight < top || targetHeight > bottom){
        /*window.setTimeout(()=>{
            if(element)
                
        }, 10);*/
        ctx.interface.scrollTop = ((targetHeight - height + 2) * char.height) + Y_OFFSET;
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
export function getView(): {template: ViewTemplate, init:(view:BiosView|null)=>void}
export function getView(width:number,  height:number): {template: ViewTemplate, init:(view:BiosView|null)=>void}
export function getView(w:number = width * char.width, h:number = height * char.height): {template: ViewTemplate, init:(view:BiosView|null)=>void}{
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

    let size = char.width;
    return {
        init:(v:BiosView|null)=>{
            view = v
            if(v === null){
                const w = width * char.width;
                const h = (height * char.height)+Y_OFFSET;

                ctx!.canvas.width = w;
                ctx!.canvas.height = h;
                ctx!.interface.style.width = `${w}px`;
                ctx!.interface.style.height = `${h+INTERFACE_OFFSET}px`;
            }
        },
        template: {
            font: {
                width: char.width,
                height: char.height,
                color: font
            },
            background: {
                color: background,
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
                    return size;
                },
                set fontSize(n:number){
                    size = n;
                    ctx!.font = `${n-1}px monospace`;
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
