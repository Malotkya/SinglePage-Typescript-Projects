/** /System/IO
 * 
 * @author Alex Malotky
 */
import { comparePositions, DisplayInitInfo, HighlightMap, initDisplay, releaseDisplay, print, scroll, cursor, FONT_RATIO, Y_OFFSET, INTERFACE_OFFSET, viewTemplate} from "./Display";
import { StdInputBuffer, StdOutputBuffer} from "./Kernel/IO";
import View, {SystemView} from "./View";
import { InitalizeResult, Success } from "./Initalize";
import History from "./History";
import Mouse, {MouseButton} from "./Mouse";
import Keyboard, { KeyboardData } from "./Keybaord";
import { getHighlightedFromBuffer } from "./Stream";
import Color from "@/Color";

let view:SystemView|null = null;
const input = new StdInputBuffer();
const output = new StdOutputBuffer();

const DEFAUTL_PROMPT = "";
let prompt = DEFAUTL_PROMPT;

export interface BiosInitData extends DisplayInitInfo {
    getHistory:()=>History|null
}

export interface BiosContext{
    keyboard:(e:CustomEvent<KeyboardData>)=>Promise<void>
    mouse:(e:CustomEvent<MouseButton>)=>Promise<void>
    render:(e:Event)=>Promise<void>
    setHeight:(value:number)=>void
    setWidth:(value:number)=>void
    setBackground:(value:Color)=>void
    setColor:(value:Color)=>void
    setSize:(value:number)=>void
}

export function setPrompt(value?:string|null) {
    prompt = value || DEFAUTL_PROMPT;
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
export async function claimBios(target:HTMLElement, data:BiosInitData):Promise<InitalizeResult<BiosContext>>{
    const response = initDisplay(target, data);
    if(response.type === "Failure")
        return response;

    const ctx = response.value;

    return Success({
        /** Input Event Handler
         * 
         * Handles keys being pressed
         * 
         * @param {CustomEvent} event
         */
        async keyboard(event:CustomEvent<KeyboardData>) {
            scroll(undefined, true);

            const history = data.getHistory();
            const {key, value} = event.detail;
            
            switch(key){    
                case "ArrowUp":
                    if(history){
                        history.index -= 1;
                        input.value = history.current;
                    }
                    break;
                    
                case "ArrowDown":
                    if(history){
                        history.index += 1;
                        input.value = history.current;
                    }
                    break;
            
                case "ControlLeft":
                case "ControlRight":
                    if(Keyboard.isKeyPressed("KeyC") && ctx.highlight)
                        _copy(ctx.highlight, ctx.width);
                    break;
                    
                default:
                    input.keyboard(key, value);
            }
        },

        /** Mouse Event Handler
         * 
         * @param event 
         */
        async mouse(event: CustomEvent<MouseButton>) {
            if(event.detail === "Secondary") {
                navigator.clipboard.readText().then((string)=>{
                    input.value = string;
                });
            }
        },

        /** Render Event Listener
         * 
         */
        async render(event:Event) {
            print(output.value);
            
            print(prompt);
            if(!input.hide) {
                print(input.value);
            }
        
            cursor(input.cursor-input.value.length);
            scroll();
        },

        setHeight(value:number) {
            ctx.height = value;
            value *= ctx.char.height;
            ctx.interface.style.height = `${value}px`;
            ctx.canvas.height = value;
        },

        setWidth(value:number){
            ctx.width = value;
            value *= ctx.char.width;
            ctx.interface.style.width = `${value}px`;
            ctx.canvas.width = value;
        },

        setBackground(value:Color) {
            ctx.backgroundColor = value;
        },

        setColor(value:Color){
            ctx.fontColor = value;
        },

        setSize(value:number){
            ctx.fontSize = value;
            ctx.fontFace = `${value-1}px monospace`;
            ctx.char.width = value * FONT_RATIO;
            ctx.char.height = value;
            const width  = ctx.width * ctx.char.width;
            const height = ctx.height * ctx.char.height + Y_OFFSET;
            ctx.interface.style.width = `${width}px`;
            ctx.canvas.width = width;
            ctx.interface.style.height = `${height+INTERFACE_OFFSET}px`;
            ctx.canvas.height = height;
        }
    });
}

/** Release Bios
 * 
 * @param target 
 */
export function releaseBios(target:HTMLElement) {
    releaseDisplay(target);
}

/** View Getter
 * 
 * @returns {SystemView|null}
 */
export function getView():SystemView|null {
    return view;
}

/** Initalize View
 * 
 * @param {number} [width]
 * @param {number} [height]
 * @returns {View}
 */
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

/** Copy Highlited String
 * 
 * @param {HighlightMap} map 
 * @param {number} width 
 */
async function _copy(map:HighlightMap, width:number):Promise<void> {
    const [_, end] = map;
    const pos = {x:0, y:0};
    let buffer = getHighlightedFromBuffer(output.value, map, pos, width);

    if(comparePositions(pos, end) < 0){
        buffer += getHighlightedFromBuffer(prompt, map, pos, width);
    }

    if(comparePositions(pos, end) < 0) {
        buffer += getHighlightedFromBuffer(input.value, map, pos, width);
    }

    if(map){
        navigator.clipboard.writeText(buffer);
    }
}