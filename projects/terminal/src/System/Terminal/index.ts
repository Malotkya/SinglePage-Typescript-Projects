/** /System/Terminal
 * 
 * @author Alex Malotky
 */
import {BiosType, HighlighMap, claimBios, viewTemplate} from "./Bios";
import OpenRegistry from "../Registry";
import View from "./View";
import { KeyboardData } from "./Keyboard";
import { MouseButton } from "./Mouse";
import { comparePositions } from "./Position";
import { getHighlightedFromBuffer } from "../Stream";
import { InputBuffer, OutputBuffer} from "../Stream/IO";
import { getHistory, isRunning } from "..";
import {sleep} from "@";

const DEFAUTL_PROMPT = "";
let prompt = DEFAUTL_PROMPT;

let view: View|null = null;

/** Get Highlight String Helper
 * 
 * @param {HighlighMap} map 
 * @param {number} width 
 * @returns {string}
 */
function getTerminalHighlighted(map:HighlighMap, width:number):string {
    const [_, end] = map;
    const pos = {x:0, y:0};
    let buffer = getHighlightedFromBuffer(OutputBuffer.value, map, pos, width);

    if(comparePositions(pos, end) < 0){
        buffer += getHighlightedFromBuffer(prompt, map, pos, width);
    }

    if(comparePositions(pos, end) < 0) {
        buffer += getHighlightedFromBuffer(InputBuffer.value, map, pos, width);
    }

    return buffer;
}

export function setPrompt(value?:string|null) {
    prompt = value || DEFAUTL_PROMPT;
}

export function getView():View|null {
    return view;
}

export function initView(w?:number, h?:number): View {
    const {template, init} = viewTemplate();
    const clear = (v:View|null)=>{
        view = v;
        init(v);
    }

    return new View(template, clear);
}

/** Terminal Interface
 * 
 * Acts as the interface between the User and the System through the Bios.
 */
class TerminalInterface extends HTMLElement{
    #bios: BiosType|null|undefined;

    constructor(){
        super();
        sleep(50).then(()=>this.init())

        this.addEventListener("keyboard", async(event:CustomEventInit<KeyboardData>)=>{
            if(event.detail === undefined)
                throw new Error("Missing Keyboard Detail!");

            if(view !== null){
                await view.keyboard(event as any);
            } else {
                await this.keyboard(event as any);
            }
        });

        this.addEventListener("mouse", async(event:CustomEventInit<MouseButton>)=>{
            if(event.detail === undefined)
                throw new Error("Missing Mouse Detail!");

            if(view !== null){
                await view.mouse(event as any);
            } else {
                await this.mouse(event as any);
            }
        });
        
        /** Render Event Listener
         * 
         * Handles the render event
         */
        this.addEventListener("render", async(event:Event)=>{
            if(view !== null){
                await view.render(event);
            } else {
                await this.render(event);
            }
        });
    }

    async init(){
        while(!isRunning())
            await sleep();
        
        try {
            const reg = await OpenRegistry("terminal", {
                height: "number",
                width: "number",
                background: {
                    color: "color"
                },
                font: {
                    color: "color",
                    size: "number"
                }
            });
            this.#bios = claimBios(this, {
                backgroundColor: reg.get("background").get("color"),
                fontColor: reg.get("font").get("color"),
                fontSize: reg.get("font").get("size"),
                width: reg.get("width"),
                height: reg.get("height")
            });
        }catch (e){
            console.error(e);
            this.#bios = null;
        }
        
    }

    async assertReady():Promise<BiosType> {
        while(this.#bios === undefined)
            await sleep();
        
        if(this.#bios === null)
            throw new Error("The bios has failed to initiate!");

        return this.#bios;
    }

    /** Input Event Handler
     * 
     * Handles keys being pressed
     * 
     * @param {CustomEvent} event
     */
    async keyboard(event:CustomEvent<KeyboardData>) {
        const bios = await this.assertReady();

        bios.scroll(undefined, true);
        const history = getHistory();
        const {key, value} = event.detail;

        switch(key){
            case "Backspace":
                InputBuffer.cursor -=1;
                InputBuffer.delete();
                break;

            case "Delete":
                InputBuffer.delete();
                break;
                    
            case "ArrowUp":
                if(history){
                    history.index -= 1;
                    InputBuffer.value = history.current;
                }
                break;
        
            case "ArrowDown":
                if(history){
                    history.index += 1;
                    InputBuffer.value = history.current;
                }
                break;

            case "ArrowLeft":
                InputBuffer.cursor--;
                break;

            case "ArrowRight":
                InputBuffer.cursor++;
                break;

            case "ControlLeft":
            case "ControlRight":
                if(bios.Keyboard.isKeyPressed("KeyC"))
                    await this.copy(bios.highlight);
                break;
        
            case "Enter":
            case "NumpadEnter":
                InputBuffer.value += "\n";
                break;
        
            default:
                InputBuffer.add( value );
                break;
        }
    }

    /** Mouse Event Handler
     * 
     * @param event 
     */
    async mouse(event: CustomEvent<MouseButton>) {
        if(event.detail === "Secondary") {
            navigator.clipboard.readText().then((string)=>{
                InputBuffer.value = string;
            });
        }
    }

    /** Render Event Listener
     * 
     */
    async render(event:Event) {
        const bios = await this.assertReady();

        bios.print(OutputBuffer.value);
        
        bios.print(prompt);
        if(!InputBuffer.hide) {
            bios.print(InputBuffer.value);
        }
    
        bios.cursor(InputBuffer.cursor-InputBuffer.value.length);
        bios.scroll();
    }

    async copy(map:HighlighMap|null):Promise<void> {
        const bios = await this.assertReady();

        if(map){
            navigator.clipboard.writeText(getTerminalHighlighted(map, bios.width));
        }
    }
}

customElements.define("terminal-interface", TerminalInterface);