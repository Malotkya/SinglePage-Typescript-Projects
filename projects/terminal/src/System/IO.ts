/** /System/IO
 * 
 * @author Alex Malotky
 */
import {DisplayInitInfo, DisplayContext, HighlightMap, initDisplay, releaseDisplay, BaseDisplayInterface, put, print, scroll, cursor, FONT_RATIO, Y_OFFSET, INTERFACE_OFFSET, viewTemplate} from "./Display";
import View, {SystemView} from "./View";
import Color from "@/Color";
import { InitalizeResult, Success, Failure } from "./Initalize";
import Mouse from "./Mouse";
import Keyboard from "./Keybaord";

export { StdInputBuffer, StdOutputBuffer} from "./Kernel/IO";

let ctx:DisplayContext|null = null;
let view:SystemView|null = null;

export interface BiosContext extends BaseDisplayInterface{
    readonly Mouse: typeof Mouse,
    readonly Keyboard: typeof Keyboard
    put: typeof put
    print: typeof print
    scroll: typeof scroll
    cursor: typeof cursor
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
export function claimBios(target:HTMLElement, data:DisplayInitInfo):InitalizeResult<BiosContext>{
    if(ctx !== null)
        Failure(new Error("Bios has already been claimed by another element!"));


    const response = initDisplay(target, data);
    if(response.type === "Failure")
        return response;

    ctx = response.value;

    return Success({
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

        get backgroundColor():Color {
            return ctx?.backgroundColor || new Color(0, 0, 0);
        },

        set backgroundColor(value:Color) {
            if(ctx)
                ctx.backgroundColor = value;
        },

        get fontColor():Color {
            return ctx?.fontColor || new Color(0, 0, 0);
        },

        set fontColor(value:Color){
            if(ctx)
                ctx.fontColor = value;
        },

        get fontSize():number {
            return ctx?.fontSize || 0;
        },

        set fontSize(value:number){
            if(ctx){
                ctx.fontSize = value;
                ctx.fontFace = `${value-1}px monospace`;
                ctx.char.width = value * FONT_RATIO;
                ctx.char.height = value;
                const w = ctx.width * ctx.char.width;
                const h = ctx.height * ctx.char.height+Y_OFFSET;
                ctx.interface.style.width = `${w}px`;
                ctx.canvas.width = w;
                ctx.interface.style.height = `${h+INTERFACE_OFFSET}px`;
                ctx.canvas.height = h;
            }
        },

        get x():number {
            return ctx?.x || -1;
        },

        get y():number {
            return ctx?.y || -1;
        },

        get highlight():HighlightMap|null {
            return ctx?.highlight || null
        },

        get scrollLocked():boolean {
            return ctx?.scrollLocked || false;
        },

        put, print, scroll, cursor, Mouse, Keyboard
    })
}


/** Release Bios
 * 
 * @param target 
 */
export function releaseBios(target:HTMLElement) {
    releaseDisplay(target);
}

export function getView():SystemView|null {
    return view;
}

export function initalizeView():View
export function initalizeView(width:number, height:number):View
export function initalizeView(width?:number, height?:number):View {
    const {template, init} = viewTemplate(width!, height!);
    const clear = (v:View|null)=>{
        view = v;
        init(v);
    }
    
    return new View(template, clear);
}