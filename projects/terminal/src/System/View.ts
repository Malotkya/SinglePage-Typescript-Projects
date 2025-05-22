/** /System/View.ts
 * 
 * @author Alex Malotky
 */

import { HIGHLIGHT_OFFSET } from "./Display";
import PixelMatrix from "./Kernel/View/PixelMatrix";
import { KernelView, ViewContext, KernelViewTemplate } from "./Kernel/View";
import { sleep } from "@";
import Color from "@/Color";
import Keyboard, {KeyboardData} from "./Keybaord";
import Mouse, {MouseButton} from "./Mouse";

export type {PixelMatrix}

export interface SystemView {
    readonly Mouse: typeof Mouse
    readonly Keyboard: typeof Keyboard
    keyboard:(e:CustomEvent<KeyboardData>)=>Promise<void>
    mouse:(e:CustomEvent<MouseButton>)=>Promise<void>
    render:(e:Event)=>Promise<void>
    wait:()=>Promise<void>
    close: ()=>void
}

export interface UserView extends KernelView{
    on:<N extends keyof ViewEventMap>(name: N, handler:(e:ViewEventMap[N])=>void)=>void
    emit:<N extends keyof ViewEventMap>(e:ViewEventMap[N])=>void
    print:{
        (x:number, y:number, s:string, cursor?:number):void
        (x:number, y:number, s:string, textWrap:boolean):void
    }
    flip:(x:number, y:number)=>void
    clear:()=>void
    wait:()=>Promise<void>
    readonly ctx: ViewContext
}

type ViewEventMap = {
    "keyboard": CustomEvent<KeyboardData>
    "mouse":    CustomEvent<MouseButton>
    "render":   CustomEvent<undefined>
    "close":    CustomEvent<undefined>
    [k:string]: CustomEvent<any> 
}

export default class View implements KernelView, SystemView, UserView{
    readonly font: KernelViewTemplate["font"];
    private _background: KernelViewTemplate["background"];
    readonly ctx:ViewContext;
    readonly Mouse = Mouse;;
    readonly Keyboard = Keyboard;
    private callbacks:Record<string, Function>;
    private _running:boolean;

    constructor(template: KernelViewTemplate, callback:(v:View|null)=>void){
        const {font, background, ctx} = template;
        this.font = font;
        this._background = background;
        this.ctx = ctx;
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

    async keyboard(event:CustomEvent<KeyboardData>){
        if(this.callbacks["keyboard"])
            await this.callbacks["keyboard"](event);
    }

    async mouse(event:CustomEvent<MouseButton>){
        if(this.callbacks["mouse"])
            await this.callbacks["mouse"](event);
    }

    async render(event:Event){
        if(this.callbacks["render"])
            await this.callbacks["render"](event);
    }

    print(x:number, y:number, text:string, cursor?:number|boolean) {
        this.ctx.fillColor = this.font.color;
        this.ctx.fontSize  = this.font.height;

        if(cursor){
            if(typeof cursor === "number")
                cursor -= text.length;
            else
                cursor = -1;

            for(let i=0; i<text.length; ++i) {
                const char = text.charAt(i);
                if(char === '\n' || char === '\r') {
                    if(i === cursor)
                        this.flip(x, y);
                    x = 0;
                    y++;

                } else {
                    this.ctx.fillText(char, (x+1)*this.font.width, (y+1)*(this.font.height+1));
                    if(i === cursor)
                        this.flip(x, y);
                    x++;

                    if(x > this.width) {
                        x = 0;
                        y++;
                    }
                }

                
            }

        } else {
            y += 1;
            for(const c of text)
                this.ctx.fillText(c, (++x)*this.font.width, (y)*(this.font.height+1));
        }
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