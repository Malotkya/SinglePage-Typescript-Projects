/** /System/Terminal/View.ts
 * 
 * @author Alex Malotky
 */
import { KeyboardData } from "./Keyboard";
import { KeyboardType } from "./Keyboard";
import { MouseButton, MouseType } from "./Mouse";
import { HIGHLIGHT_OFFSET, PixelFunction } from "./Bios";
import { sleep } from "..";
import Color from "@/Color";

interface ViewContext {
    fillColor: Color
    fontSize: number
    fontWidth: number
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
    accessPixels:{
        (func: PixelFunction): void;
        (width: number, height: number, func: PixelFunction): void;
        (x: number, y: number, height: number, width: number, func: PixelFunction): void;
    }
} 

interface SpacialData {
    width: number
    height: number
    color: Color
}

type ViewEventMap = {
    "keyboard": CustomEvent<KeyboardData>
    "mouse":    CustomEvent<MouseButton>
    "render":   CustomEvent<undefined>
    "close":    CustomEvent<undefined>
    [k:string]: CustomEvent<any> 
}

export interface BiosView {
    readonly font: SpacialData
    backgroundColor: Color
    readonly width: number
    readonly height: number
    readonly Mouse: MouseType
    readonly Keyboard: KeyboardType
    close: ()=>void
}

export interface SystemView {
    keyboard:(e:CustomEvent<KeyboardData>)=>void
    mouse:(e:CustomEvent<MouseButton>)=>void
    render:(e:Event)=>void
    close: ()=>void
}

export interface UserView extends BiosView{
    on:<N extends keyof ViewEventMap>(name: N, handler:(e:ViewEventMap[N])=>void)=>void
    emit:<N extends keyof ViewEventMap>(e:ViewEventMap[N])=>void
    print:(x:number, y:number, s:string)=>void
    flip:(x:number, y:number)=>void
    clear:()=>void
    wait:()=>Promise<void>
    readonly ctx: ViewContext
}

export interface ViewTemplate {
    font: SpacialData
    background: SpacialData
    ctx: ViewContext
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
    private _running:boolean;

    constructor(template: ViewTemplate, callback:(v:View|null)=>void){
        const {font, background, ctx, mouse, keyboard} = template;
        this.font = font;
        this._background = background;
        this.ctx = ctx;
        this.Mouse = mouse;
        this.Keyboard = keyboard;
        this.callbacks = {};
        this.callbacks[""] = ()=>callback(null);
        this._running = true;
        callback(this);
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

    keyboard(event:CustomEvent<KeyboardData>){
        if(this.callbacks["keyboard"])
            this.callbacks["keyboard"](event);
    }

    mouse(event:CustomEvent<MouseButton>){
        if(this.callbacks["mouse"])
            this.callbacks["mouse"](event);
    }

    render(event:Event){
        if(this.callbacks["render"])
            this.callbacks["render"](event);
    }

    print(x:number, y:number, text:string) {
        this.ctx.fillColor = this.font.color;
        this.ctx.fontSize  = this.font.height;

        y++;
        for(const c of text)
            this.ctx.fillText(c, (++x)*this.font.width, (y)*(this.font.height+1));
    }

    flip(x:number, y:number){
        x = ((x+1)*this.font.width) - HIGHLIGHT_OFFSET;
        y = ((y+1)*this.font.height) - HIGHLIGHT_OFFSET;

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
        this.ctx.fillColor = this._background.color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    on<N extends keyof ViewEventMap>(name: N|string, handler:(e:ViewEventMap[N])=>void){
        name = String(name);
        if(name.length < 1)
            throw new TypeError("Invalid event name!");

        if(this.callbacks[name])
            throw new Error("Event name is already taken!");

        this.callbacks[name] = handler;
    }

    emit(e:Event) {
        if(this.callbacks[e.type])
            this.callbacks[e.type](e);
    }

    close(){
        this._running = false;
        this.callbacks[""]();
        this.emit(new CustomEvent("close"));
    }

    async wait() {
        while(this._running)
            await sleep(1000);
    }
}