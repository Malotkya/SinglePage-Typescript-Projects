/** /Terminal/Mouse
 * 
 * This file currently does nothing but will eventualy function similar to the
 * keyboard file.
 * 
 * @author Alex Malotky
 */
import { Y_OFFSET } from "./Bios";

const MOUSE_BUTTONS = [
    "Main", "Center", "Secondary", "Fourth", 
] as const;
export type MouseButton = typeof MOUSE_BUTTONS[number];

export interface Position {
    x: number,
    y: number
}

export interface Dimensions {
    width: number,
    height: number
}

/** Get Position
 * 
 * @param {MouseEvent} event 
 * @param {Dimensions} dim 
 * @returns {Position}
 */
function getPostion(event:MouseEvent, dim:Dimensions):Position {
    const x = Math.floor(event.offsetX / dim.width);
    const y = Math.floor((event.offsetY - Y_OFFSET) / dim.height);

    return {x, y};
}

/** Compare Positions
 * 
 * @param {Position} lhs 
 * @param {Position} rhs 
 * @returns {number}
 */
function comparePositions(lhs:Position, rhs:Position):number {
    const test = lhs.y - rhs.y;
    if(test !== 0)
        return test;

    return lhs.x = rhs.x;
}

export function normalizePositions(map:[Position, Position]|null, max:Position):[Position, Position]|null {
    if(map === null)
        return map;

    //Quit if same position
    const compare = comparePositions(...map)
    if( compare === 0)
        return null;

    const lhs = comparePositions(map[0], max);
    const rhs = comparePositions(map[1], max);
    //Quit if both are out of bounds
    if(lhs > 0 && rhs > 0) {
        return null;

    //First Position out of bounds
    } else if(lhs > 0) {
        return [map[1], max];

    //Second Position out of bounds
    } else if(rhs > 0) {
        return [map[0], max];

    //Both are in bounds and out of order
    } else if(compare > 0){
        return [map[1], map[0]]
    }

    //Already in proper order.
    return map;
}

export function getButton(value:number):MouseButton {
    return MOUSE_BUTTONS[value];
}

export default function Mouse(dim:Dimensions) {
    //Start Postition Reference
    let start:Position|null = null;
    let pos:Position = {x: 0, y: 0};
    let button:keyof typeof MOUSE_BUTTONS|-1 = -1;

    return {
        /** Report Mouse Click Down 
         * 
         * @param {MouseEvent} event 
         * @returns {Position}
         */
        reportMouseDown(event:MouseEvent):Position {
            button = event.button;
            start = getPostion(event, dim);
            return start;
        },

        /** Report Mouse Move
         * 
         * @param {MouseEvent} event 
         * @returns {Position[]}
         */
        reportMouseMove(event:MouseEvent):[Position, Position]|null {
            pos = getPostion(event, dim);
            if(start){
                return [start, pos];
            }
        
            return null;
        },

        /** Report Mouse Click Up
         * 
         * @param {MouseEvent} event
         * @returns {Postion[]}
         */
        reportMouseUp(event:MouseEvent):[Position, Position]|null {
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
        },

        /** Current Mouse Position
         * 
         */
        get position():Position {
            return pos;
        },

        /** Is Mouse CLicking down.
         * 
         */
        isDown(b:MouseButton):boolean {
            return button === MOUSE_BUTTONS.indexOf(b);
        }
    };
}

export interface MouseType {
    position: Position,
    isDown(b:MouseButton):boolean
}