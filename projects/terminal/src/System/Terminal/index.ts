/** /System/Terminal
 * 
 * @author Alex Malotky
 */
import {BiosType, HighlighMap, claimBios, viewTemplate} from "./Bios";
import View from "./View";
import { KeyboardData } from "./Keyboard";
import { MouseButton } from "./Mouse";
import { comparePositions } from "./Position";
import { getHighlightedFromBuffer } from "../Stream";
import { InputBuffer, OutputBuffer} from "../Stream/IO";
import { getHistory } from "..";

const DEFAUTL_PROMPT = "$ ";
let prompt = DEFAUTL_PROMPT;

let view: View|null = null;
let password = false;

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
    #bios: BiosType;

    constructor(){
        super();
        this.#bios = claimBios(this);

        
        this.addEventListener("keyboard", (event:CustomEventInit<KeyboardData>)=>{
            if(event.detail === undefined)
                throw new Error("Missing Keyboard Detail!");

            if(view !== null){
                view.keyboard(event as any);
            } else {
                this.keyboard(event as any);
            }
        });

        this.addEventListener("mouse", (event:CustomEventInit<MouseButton>)=>{
            if(event.detail === undefined)
                throw new Error("Missing Mouse Detail!");

            if(view !== null){
                view.mouse(event as any);
            } else {
                this.mouse(event as any);
            }
        });
        
        /** Render Event Listener
         * 
         * Handles the render event
         */
        this.addEventListener("render", (event:Event)=>{
            if(view !== null){
                view.render(event);
            } else {
                this.render(event);
            }
        });
    }

    /** Input Event Handler
     * 
     * Handles keys being pressed
     * 
     * @param {CustomEvent} Event
     */
    keyboard(event:CustomEvent<KeyboardData>) {
        this.#bios.scroll(undefined, true);
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
                if(this.#bios.Keyboard.isKeyPressed("KeyC"))
                    this.copy(this.#bios.highlight);
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
    mouse(event: CustomEvent<MouseButton>) {
        if(event.detail === "Secondary") {
            navigator.clipboard.readText().then((string)=>{
                InputBuffer.value = string;
            });
        }
    }

    /** Render Event Listener
     * 
     */
    render(event:Event) {
        this.#bios.print(OutputBuffer.value);
        
        this.#bios.print(prompt);
        if(!password) {
            this.#bios.print(InputBuffer.value);
        }
    
        this.#bios.cursor(InputBuffer.cursor-InputBuffer.value.length);
        this.#bios.scroll();
    }

    copy(map:HighlighMap|null):void {
        if(map){
            navigator.clipboard.writeText(getTerminalHighlighted(map, this.#bios.width));
        }
    }
}

customElements.define("terminal-interface", TerminalInterface);