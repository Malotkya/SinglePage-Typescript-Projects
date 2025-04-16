/** /Terminal/View.ts
 * 
 * @author Alex Malotky
 */
import { KeyCode } from "./Keyboard";
import { KeyboardType } from "./Keyboard";
import { MouseButton, MouseType } from "./Mouse";
import { HIGHLIGHT_OFFSET, PixelFunction } from "./Bios";
import Color from "@/Color";

interface ViewContext {
    fillColor: Color
    fontSize: number
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
    accessPixels:(x:number|PixelFunction, y?:number, height?:number|PixelFunction, width?:number, func?:PixelFunction)=>void
} 

interface SpacialData {
    width: number
    height: number
    color: Color
}

type ViewEventMap = {
    "keyboard": (e:CustomEventInit<KeyCode>)=>void
    "mouse": (e:CustomEventInit<MouseButton>)=>void
    "render": (e:Event)=>void
    [n:string]: (e:Event)=>void
}

export interface BiosView {
    readonly font: SpacialData
    backgroundColor: Color
    readonly width: number
    readonly height: number
    readonly Mouse: MouseType
    readonly Keyboard: KeyboardType
    delete: ()=>void
}

export interface SystemView {
    keyboard:(e:CustomEventInit<KeyCode>)=>void
    mouse:(e:CustomEventInit<MouseButton>)=>void
    render:(e:Event)=>void
    delete: ()=>void
}

export interface UserView {
    on:<N extends keyof ViewEventMap>(name: N, handler:ViewEventMap[N])=>void
    print:(x:number, y:number, s:string)=>void
    flip:(x:number, y:number)=>void
    delete:()=>void
    clear:()=>void
    readonly ctx: ViewContext
}

export interface ViewTemplate {
    font: SpacialData
    background: SpacialData
    ctx: ViewContext
    init: (view:View|null)=>void
    mouse: MouseType
    keyboard: KeyboardType
}

export default class View implements BiosView, SystemView, UserView{
    readonly font: ViewTemplate["font"];
    private _background: ViewTemplate["background"];
    readonly ctx:ViewContext;
    readonly Mouse: MouseType;
    readonly Keyboard: KeyboardType;
    private callbacks:Record<string, Function>;

    constructor(template: ViewTemplate){
        const {font, background, ctx, mouse, keyboard, init} = template;
        this.font = font;
        this._background = background;
        this.ctx = ctx;
        this.Mouse = mouse;
        this.Keyboard = keyboard;
        this.callbacks = {};
        this.callbacks["clearBios"] = ()=>init(null);
        init(this);
    }

    get backgroundColor() {
        return this._background.color
    }

    set backgroundColor(c:Color) {
        this._background.color = c;
    }

    get width() {
        return this._background.width;
    }

    get height() {
        return this._background.height;
    }

    get keyboard(){
        return this.callbacks["keyboard"] as SystemView["keyboard"];
    }

    get mouse(){
        return this.callbacks["mouse"] as SystemView["mouse"];
    }

    get render(){
        return this.callbacks["render"] as SystemView["render"];
    }

    print(x:number, y:number, text:string) {
        this.ctx.fillColor = this.font.color;
        this.ctx.fontSize  = this.font.height;
        this.ctx.fillText(text, x*this.font.width, y*(this.font.height+1));
    }

    flip(x:number, y:number){
        x = (x*this.font.width) - HIGHLIGHT_OFFSET;
        y = (y*this.font.height) - HIGHLIGHT_OFFSET;

        this.ctx.accessPixels(x, y, this.font.width, this.font.height, (matrix)=>{
            for(const pixel of matrix){
                if(this._background.color.equals(pixel.red, pixel.green, pixel.blue)) {
                    pixel.red = this.font.color.red;
                    pixel.green = this.font.color.green;
                    pixel.blue = this.font.color.blue;
                } else {
                    pixel.red = this._background.color.red;
                    pixel.green = this._background.color.green;
                    pixel.blue = this._background.color.blue;
                }
            }
        });

    }

    clear() {

    }

    on<N extends keyof ViewEventMap>(name: N, handler:ViewEventMap[N]){

    }

    delete(){
        this.callbacks["clearBios"]();
    }
}