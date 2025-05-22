/** /System/Kernel/View
 * 
 * @author Alex Malotky
 */
import { PixelFunction } from "./PixelMatrix";
import Encoding from "../Encoding";
import Color from "@/Color";

export interface SpacialData {
    width: number
    height: number
    color: Color
}

export interface KernelView {
    readonly font: SpacialData
    backgroundColor: Color
    readonly width: number
    readonly height: number
    close: ()=>void
}

export interface KernelViewTemplate {
    font: SpacialData
    background: SpacialData
    ctx: ViewContext
}

export type KernelViewCallback = (view:KernelView|null)=>unknown;

export interface ViewContext {
    fontSize: number
    fontWidth: number
    fillColor: Color
    lineCap: "butt"|"round"|"square"
    lineDashOffset:number
    lineJoin: "round"|"bevel"|"miter"
    lineWidth: number
    miterLimit: number
    strokeStyle: Color
    arc:(x:number, y:number, radius:number, startAngle:number, endAngle:number, counterclockwise?:boolean)=>void
    arcTo:(x1:number, y1:number, x2:number, y2:number, radius:number)=>void
    beginPath:()=>void
    clearRect:(x:number, y:number, width:number, height:number)=>void
    closePath:()=>void
    ellipse:(x:number, y:number, radiusX:number, radiusY:number, rotation:number, startAngle:number, endAngle:number, counterclockwise?:boolean)=>void
    fillRect:(x:number, y:number, width:number, height:number)=>void
    fillText:(text:string, x:number, y:number, maxWidth?:number)=>void
    lineTo:(x:number, y:number)=>void
    moveTo:(x:number, y:number)=>void
    rect:(x:number, y:number, width:number, height:number)=>void
    roundRect:(x:number, y:number, width:number, height:number, radii:number)=>void
    setLineDash:(segments:number[])=>void
    stroke:()=>void
    strokeRect:(x:number, y:number, width:number, height:number)=>void
    strokeText:(text:string, x:number, y:number, maxWidth?:number)=>void
    drawImage:(x:number, y:number, image:Uint8Array|Encoding)=>void
    accessPixels:{
        (func: PixelFunction): void;
        (width: number, height: number, func: PixelFunction): void;
        (x: number, y: number, height: number, width: number, func: PixelFunction): void;
    }
} 