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

function getPostion(event:MouseEvent, dim:Dimensions):Position {
    const x = Math.floor(event.offsetX / dim.width);
    const y = Math.floor((event.offsetY - Y_OFFSET) / dim.height);

    return {x, y};
}

function orderPostions(lhs:Position, rhs:Position):[Position, Position]|null {
    if(lhs.y < rhs.y) {
        return [lhs, rhs];
    } else if (lhs.y > rhs.y) {
        return [rhs, lhs];
    } if(lhs.x < rhs.x) {
        return [lhs, rhs];
    } else if (lhs.x > rhs.x) {
        return [rhs, lhs];
    }

    return null;
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
            console.debug(start);
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
                console.debug(start, pos);
                return orderPostions(start, pos);
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
                const output = orderPostions(
                    start,
                    getPostion(event, dim)
                );
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