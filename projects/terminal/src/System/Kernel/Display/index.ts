/** /System/Kernel/Display
 * 
 * @author Alex Malotky
 */
import { Success, Failure, InitalizeResult } from "../Initalize";
import DisplayContext, {BaseDisplayInterface, HighlighMap, Y_OFFSET} from "./Context";
import {normalizePositions} from "./Position";
import * as Mouse from "../Mouse";
import * as Keyboard from "../Keyboard";

const HIGHLIGHT_OFFSET = 1;

//Display Context
let ctx:DisplayContext|null = null;

//Private Vairables
let x:number = 0;
let y:number = 0;
let growHeight:number = 0;
let scrollLocked:boolean = true;
let highlightMap:HighlighMap|null = null;

/** Initalize Display
 * 
 * Starts Render Loop
 * 
 * @param {HTMLElement} target 
 * @param {BaseDisplayInterface} data 
 * @returns {InitalizeResult}
 */
export function initDisplay(target:HTMLElement, data:BaseDisplayInterface):InitalizeResult<DisplayContext> {
    try {
        ctx = DisplayContext(target, data);
    } catch (e: any){
        if( !(e instanceof Error) )
            e = new Error(String(e));

        return Failure(e);
    }

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
export function releaseDisplay(target:HTMLElement) {
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