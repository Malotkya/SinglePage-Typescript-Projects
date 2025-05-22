/** /System/Kernel/Display
 * 
 * @author Alex Malotky
 */
import { Success, Failure, InitalizeResult } from "../Initalize";
import DisplayContext, {DisplayInitInfo, HighlightMap, Y_OFFSET, INTERFACE_OFFSET} from "./Context";
import {normalizePositions} from "./Position";
import { KernelView, KernelViewTemplate, KernelViewCallback } from "../View";
import PixelMatrix, {PixelFunction} from "../View/PixelMatrix";
import Encoding from "../Encoding";
import Dimensions from "./Dimension";
import Color from "@/Color";
import * as Mouse from "../Mouse";
import * as Keyboard from "../Keyboard";

export const HIGHLIGHT_OFFSET = 1;

//Display Context
let ctx:DisplayContext|null = null;
let view:KernelView|null = null;

//Private Vairables
let x:number = 0;
let y:number = 0;
let growHeight:number = 0;
let scrollLocked:boolean = true;
let highlightMap:HighlightMap|null = null;

/** Initalize Display
 * 
 * Starts Render Loop
 * 
 * @param {HTMLElement} target 
 * @param {DisplayInitInfo} data 
 * @returns {InitalizeResult}
 */
export function initDisplay(target:HTMLElement, data:DisplayInitInfo):InitalizeResult<DisplayContext> {
    try {
        ctx = DisplayContext(target, data);
    } catch (e: any){
        if( !(e instanceof Error) )
            e = new Error(String(e));

        return Failure(e);
    }

    Object.defineProperties(ctx, {
            x: {
                get():number {
                    return x
                }
            },
            y: {
                get():number{
                    return y;
                }
            },
            scrollLocked: {
                get():boolean {
                    return scrollLocked
                }
            },
            highlight: {
                get():HighlightMap|null {
                    return highlightMap;
                }
            }
        });

    ctx.interface.addEventListener("keyup", (e)=>Keyboard.reportKeyUp(e));
    ctx.interface.addEventListener("keydown", (e)=>{
        e.preventDefault();
        const data = Keyboard.reportKeyDown(e);
        if(data.key === "Space") {
            data.value = " ";
        } else if(data.value.length > 1) {
            data.value = "";
        }
    
        target.dispatchEvent(new CustomEvent("keyboard", {detail: data}));
    });
    
    ctx.interface.addEventListener("mousedown", (e)=>{
        Mouse.reportMouseDown(e, ctx!.char);
        target.dispatchEvent(new CustomEvent("mouse", {detail: Mouse.getButton(e.button)}))
    });
    ctx.interface.addEventListener("mousemove", (e)=>{
        const update = normalizePositions(Mouse.reportMouseMove(e, ctx!.char), {x, y});
        if(update)
                highlightMap = update;
    });
    ctx.interface.addEventListener("mouseup", (e)=>{
        highlightMap = normalizePositions(Mouse.reportMouseUp(e, ctx!.char), {x, y});
    });

    _render()

    return Success(ctx);
}

/** Release Display
 * 
 * @param {HTMLElement} target 
 */
export function releaseDisplay(target:HTMLElement):void {
    if(view !== null)
        throw new Error("Unable to release bios when View is being used!");

    if(ctx?.interface === target) {
        ctx = null;
    }
}

/** Get Display
 * 
 * @returns {DisplayContext}
 */
export function getDisplay():DisplayContext|null {
    return ctx;
}

/** Assert Display Context
 * 
 * @returns {DisplayContext}
 */
function _assert():DisplayContext {
    if(ctx === null)
        throw new Error("No display context!");

    return ctx;
}

/** Grow Canvas
 * 
 */
function _grow() {
    if(y >= growHeight) {
        growHeight += ctx!.height;
        ctx!.canvas.height = growHeight * ctx!.char.height;
    }
}

/** Render to Canvas
 * 
 */
function _render(){
    if(ctx){
        _clear();
        if(ctx!.interface.dispatchEvent(new CustomEvent("render", {cancelable: true})) && highlightMap){
            const [start, end] = highlightMap;
            let y = start.y;
            if(y === end.y){
                for(let x = start.x; x<end.x; x++) {
                    _inverse(x, y);
                }
            } else {
                for(let x = start.x; x < ctx!.width; x++) {
                    _inverse(x, y);
                }
                while(++y < end.y) {
                    for(let x = 0; x< ctx!.width; x++){
                        _inverse(x, y);
                    }
                }
                for(let x = 0; x<end.x; x++) {
                    _inverse(x, y);
                }
            }
        }
        requestAnimationFrame(_render);
    }
}

/** Inverse Section
 * 
 * @param {number} x
 * @param {number} y
 */
function _inverse(x:number, y:number) {
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

/** Clear Canvas for Redraw
 * 
 */
function _clear(): void {
    ctx!.fillStyle = ctx!.backgroundColor.toString();
    ctx!.fillRect( 0, 0, ctx!.canvas.width, ctx!.canvas.height);
    x = 0;
    y = 0;
}

/** Put Single Character
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {string} c 
 */
export function put(x:number, y:number, c:string):void {
    const ctx = _assert();

    ctx.fillStyle = ctx.fontColor.toString();
    ctx.font = ctx.fontFace;
    ctx.fillText(c.charAt(0), (x+1)*ctx!.char.width, ((y+1)*ctx!.char.height)+Y_OFFSET)
}

/** Print String
 * 
 * @param {string} s 
 */
export function print(s:string):void {
    const ctx = _assert();

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
    _grow();
}

/** Scroll to y-axis
 * 
 * @param {number} targetHeight 
 */
export function scroll(targetHeight:number = y, override:boolean = scrollLocked):void {
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
/** Highlight Cursor
 * @param {number} cx
 * @param {number} cy
 */
export function cursor(cx:number = 0, cy:number = 0):void {
    const ctx = _assert();

    x += cx;
    y += cy;
        
    while(x < 0){
        x += ctx.width;
        y--;
    }
        
    while(x > ctx.width){
        x -= ctx.width;
        y++;
    }
        
    _inverse(x, y);
}

/** Get View Data
 * 
 * @param {number} width
 * @param {number} height
 * @returns {Object}
*/
export function viewTemplate(): {template: KernelViewTemplate, init:KernelViewCallback}
export function viewTemplate(width:number,  height:number): {template: KernelViewTemplate, init:KernelViewCallback}
export function viewTemplate(w:number = ctx!.width * ctx!.char.width, h:number = ctx!.height * ctx!.char.height): {template: KernelViewTemplate, init:KernelViewCallback}{
    if(ctx === null)
        throw new Error("Bio is not yet claimed!");
    
    if(w >= document.body.clientWidth)
        throw new Error("Width is to large!");

    if(h >= document.body.clientHeight)
        throw new Error("Height is to large!");

    _clear();
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.interface.style.width = `${w}px`;
    ctx.interface.style.height = `${h+INTERFACE_OFFSET}px`;

    let size:Dimensions = JSON.parse(JSON.stringify(ctx!.char));
    return {
        init:(v:KernelView|null)=>{
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
