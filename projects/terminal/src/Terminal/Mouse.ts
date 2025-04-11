/** /Terminal/Mouse
 * 
 * This file currently does nothing but will eventualy function similar to the
 * keyboard file.
 * 
 * @author Alex Malotky
 */
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
    const x = Math.floor(event.clientX / dim.width);
    const y = Math.floor(event.clientY / dim.height);

    return {x, y};
}

function orderPostions(lhs:Position, rhs:Position):[Position, Position] {
    if(lhs.y < rhs.y) {
        return [lhs, rhs];
    } else if (lhs.y > rhs.y) {
        return [rhs, lhs];
    } if(lhs.x < rhs.x) {
        return [lhs, rhs];
    } else if (lhs.x > rhs.x) {
        return [rhs, lhs];
    }

    return [lhs, rhs];
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
            const start = getPostion(event, dim);
            return start;
        },

        /** Report Mouse Move
         * 
         * @param {MouseEvent} event 
         * @returns {Position[]}
         */
        reportMouseMove(event:MouseEvent):[Position, Position]|[] {
            pos = getPostion(event, dim);
            if(start){
                return orderPostions(start, pos);
            }
        
            return [];
        },

        /** Report Mouse Click Up
         * 
         * @param {MouseEvent} event
         * @returns {Postion[]}
         */
        reportMouseUp(event:MouseEvent):[Position, Position]|[] {
            let output:[Position, Position]|[] = [];
            button = -1;
            if(start){
                output = orderPostions(
                    start,
                    getPostion(event, dim)
                );
                start = null;
            }
        
            return output;
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