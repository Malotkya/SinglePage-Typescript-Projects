/** /System/Kernel/Display/Context
 * 
 * @author Alex Malotky
 */
import Position from "./Position";
import Dimensions from "./Dimension";
import Color from "@/Color";

//Public Constants
export const FONT_RATIO = 0.6;
export const Y_OFFSET = 5;
export const INTERFACE_OFFSET = 10;

//Public Types
export type HighlightMap = [Position, Position];

export default interface DisplayContext extends CanvasRenderingContext2D, BaseDisplayInterface{
    readonly interface: HTMLElement
    char: Dimensions
    fontFace: string
}

export interface BaseDisplayInterface extends DisplayInitInfo {
    readonly x:number
    readonly y:number
    readonly highlight:HighlightMap|null
    readonly scrollLocked:boolean
}

export interface DisplayInitInfo extends Dimensions {
    backgroundColor: Color,
    fontColor: Color,
    fontSize: number
}


/** Display Context
 * 
 * @param {HTMLElement} target 
 * @param {BaseDisplayInterface} data 
 * @returns {DisplayContext}
 */
export default function DisplayContext(target:HTMLElement, data:DisplayInitInfo):DisplayContext{
    const canvas = document.createElement("canvas");
    canvas.tabIndex = 1;

    const gl = canvas.getContext("2d", {alpha: false}) as DisplayContext;
    if(gl === null || gl === undefined)
        throw new Error("Unable to Initalize 2D Context!");

    const {width, height, fontSize, fontColor, backgroundColor} = data;

    const char:Dimensions = {
            width: fontSize * FONT_RATIO,
            height: fontSize
        };

    (gl as any).interface = target;
    gl.char = char;
    gl.width = width;
    gl.height = height;
    gl.backgroundColor = backgroundColor;
    gl.fontColor = fontColor;
    gl.fontSize = fontSize;
    gl.fontFace = `${fontSize-1}px monospace`;

    const w = width * char.width;
    const h = height * char.height+Y_OFFSET;
    gl.interface.style.width = `${w}px`;
    gl.canvas.width = w;
    gl.interface.style.height = `${h+INTERFACE_OFFSET}px`;
    gl.canvas.height = h;

    target.appendChild(canvas);
    canvas.focus();

    return gl;
}