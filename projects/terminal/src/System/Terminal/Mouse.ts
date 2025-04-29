/** /System/Terminal/Mouse
 * 
 * This file currently does nothing but will eventualy function similar to the
 * keyboard file.
 * 
 * @author Alex Malotky
 */
import Position, {Dimensions} from "./Position"
import { Y_OFFSET } from "./Bios";

const MOUSE_BUTTONS = [
    "Main", "Center", "Secondary", "Fourth", 
] as const;
export type MouseButton = typeof MOUSE_BUTTONS[number];

/** Get Position
 * 
 * @param {MouseEvent} event 
 * @param {Dimensions} dim 
 * @returns {Position}
 */
function getPostion(event:MouseEvent, dim:Dimensions):Position {
    const x = Math.floor(event.offsetX / dim.width);
    const y = Math.floor((event.offsetY - Y_OFFSET - 1) / dim.height);

    return {x, y};
}

export function getButton(value:number):MouseButton {
    return MOUSE_BUTTONS[value];
}

let start:Position|null = null;
let pos:Position = {x: 0, y: 0};
let button:keyof typeof MOUSE_BUTTONS|-1 = -1;

/** Report Mouse Click Down 
         * 
         * @param {MouseEvent} event 
         * @returns {Position}
         */
export function reportMouseDown(event:MouseEvent, dim:Dimensions):Position|null {
    button = event.button;
    if(button === 0) {
        start = getPostion(event, dim);
    } else {
        start = null;
    }
   
    return start;
};

/** Report Mouse Move
 * 
 * @param {MouseEvent} event 
 * @returns {Position[]}
 */
export function reportMouseMove(event:MouseEvent, dim:Dimensions):[Position, Position]|null {
    pos = getPostion(event, dim);
    if(start){
        return [start, pos];
    }

    return null;
};

/** Report Mouse Click Up
 * 
 * @param {MouseEvent} event
 * @returns {Postion[]}
 */
export function reportMouseUp(event:MouseEvent, dim:Dimensions):[Position, Position]|null {
    button = -1;
    if(start){
        const output = [
            start,
            getPostion(event, dim)
        ] satisfies[Position, Position];
        start = null;
        return output;
    }

    return null;
}

export function position():Position {
    return pos;
}

/** Is Mouse CLicking down.
 * 
 */
export function isButtonPressed(b:MouseButton):boolean {
    return button === MOUSE_BUTTONS.indexOf(b);
}

export interface MouseType {
    position: Position,
    isButtonPressed(b:MouseButton):boolean
}