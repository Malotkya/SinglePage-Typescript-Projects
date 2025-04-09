/** Bios.ts
 * 
 * @author Alex Malotky
 */
import * as Keyboard from "./Keyboard";
import * as Mouse from './Mouse';
import * as Default from './Defaults';
import System from '.';
import View from "./View";

const MAGIC_WIDTH_NUMBER = 0.6;

export interface ViewTemplate {
    top: number,
    size: {
        width: number
        height: number
    },
    font: {
        width: number
        height: number
        color: string
        size: number
        string: string
    },
    background: {
        color: string
    }
};

/** Basic I/O
 * 
 * The Bios class handels all the inputs from the user and passes it to the System
 * in a way that it can easily understand.  Also handels all the output by using
 * the 2D graphics library that draws on a canvas.
 */
export default class Bios {
    //External Components
    private _system: System;
    private _overideKey: Array<Keyboard.Key_Code>;
    private _target: HTMLElement;
    private _gl: CanvasRenderingContext2D;
    
    //Used for rendering the image
    private _width: number;
    private _height: number;
    private _charWidth: number;
    private _charHeight: number;
    private _backgroundColor: string;
    private _fontColor: string;
    private _fontFace: string;

    //Might be public?? TODO: comeback and check.
    public x: number;
    public y: number;

    /** Inital Constructor
     * 
     * @param target 
     * @param system 
     */
    constructor(target: HTMLElement, system: System){
        //Used to pass calls back up
        this._system = system;

        //Attempt to create image context
        this._target = target;
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d", { alpha: false });

        if(context === null)
            throw new Error("Unable to Initalize Context");
        this._gl = context;
        this._target.innerHTML = "";
        this._target.appendChild(canvas);

        //Position of cursor
        this.x = 0;
        this.y = 0;

        //Keys to override and prevent browser default actions
        this._overideKey = [
            Keyboard.Key_Code.BACK_SPACE,
            Keyboard.Key_Code.SPACE_BAR,
            Keyboard.Key_Code.ARROW_UP,
            Keyboard.Key_Code.ARROW_DOWN,
        ];

        //Stylings
        this._target.style.margin = "0 auto";
        this._target.style.maxHeight = "75vh";
        this._target.style.overflowX = "hidden";
        this._target.style.overflowY = "scroll";

        this._gl.canvas.tabIndex = 1;

        //Set defaul values
        this._backgroundColor = Default.COLOR_BACKGROUND;
        this._fontColor = Default.COLOR_FONT;
        this.size = Default.FONT_SIZE;
        this.width = Default.SCREEN_WIDTH;
        this.height = Default.SCREEN_HEIGHT;

        //Event listeners
        this._gl.canvas.addEventListener("keydown", event=>this.onKeyDown(event));
        this._gl.canvas.addEventListener("keyup", event=>this.onKeyUp(event))
        this._gl.canvas.addEventListener("keypress", event=>this.onKeyPress(event));

        //Start animations
        this._gl.fillStyle = this._fontColor;
        window.requestAnimationFrame(()=>this.render());
    }

    /** Grow Canvas
     * 
     * @param resizeWidth 
     */
    public grow(resizeWidth?: boolean){
        let buffer = this.clear();

        if(resizeWidth){
            this._gl.canvas.width = Number(this._target.getAttribute("width"));
        } else {
            this._gl.canvas.height += Number(this._target.getAttribute("height"));
        }

        this._gl.putImageData(buffer, 0,0);
    }

    /** Clear Canvas
     * 
     * @returns Image of past inputs
     */
    private clear(): ImageData{
        this._gl.fillStyle = this._backgroundColor;
        this._gl.fillRect( (this.x*this._charWidth), (this.y*this._charHeight), this._gl.canvas.width, this._charHeight*2);
        this._gl.fillRect( 0, (this.y*this._charHeight), this._gl.canvas.width, this._gl.canvas.height);

        return this._gl.getImageData(0,0,this._gl.canvas.width, this._gl.canvas.height);
    }

    /** Render Canvas
     * 
     */
    private render(){
        this._gl.putImageData(this.clear(), 0, 0);
        this._system.render();
        window.requestAnimationFrame(()=>this.render());
    }

    /** Total Height of Canvas
     * 
     * Diferent then the Display Height.
     * 
     * @returns 
     */
    public totalHeight(): number{
        return Math.floor(this._gl.canvas.height / this._charHeight);
    }

    /** Sleep
     * 
     * @param s 
     * @returns nothing
     */
    public static sleep(s:number = 100): Promise<void>{
        return new Promise((r,x)=>window.setTimeout(r,s));
    }

    /** Font Size Setter/Getter
     * 
     */
    public set size(value:number){
        this._fontFace = `${value}px monospace`;
        this._gl.font = this._fontFace;
        this._gl.textAlign = "center";

        this._charWidth = value * MAGIC_WIDTH_NUMBER;
        this._charHeight = value;
    }
    public get size(){
        return this._charWidth;
    }

    /** Display Width Setter/Getter
     * 
     */
    public set width(value: number){
        this._width = value;
        value *= this._charWidth;
        this._target.setAttribute("width", value.toString());
        this._target.style.width = `${value}px`
        this._gl.canvas.width = value;
    }
    public get width(){
        return this._width;
    }

    /** Display Height Setter/Getter
     * 
     */
    public set height(value: number){
        this._height = value;
        value *= this._charHeight;
        this._target.setAttribute("height", value.toString());
        this._target.style.height = `${value}px`
        this._gl.canvas.height = value;
    }
    public get height(){
        return this._height;
    }

    /** Scroll to y-axis
     * 
     * @param targetHeight 
     */
    public scroll(targetHeight:number){
        window.setTimeout(()=>this._target.scrollTop = (targetHeight + 2) * this._charHeight, 10);
    }

    /** Shutdown
     * 
     * Pretends to stop the system
     */
    public shutdown(){
        window.location.replace("/");
    }

    /** Makes sure their is enough height for a new viewport
     * 
     * @returns y-axis top of view
     */
    public view(): ViewTemplate{
        let top = (this.y-1) * this._charHeight;

        this.y += this.height;
        this.x = 1;

        if(this.y >= this.totalHeight())
            this.grow();

        //Have to wait for the growth to render.
        window.setTimeout(()=>this._target.scrollTop = top+2, 10);

        this._gl.fillStyle = this._backgroundColor;
        this._gl.fillRect( 0, top+1, this._gl.canvas.width, this._gl.canvas.height);
        this._gl.fillStyle = this._fontColor;

        return {
            top: top,
            size: {
                width: this._width,
                height: this._height
            },
            font: {
                width: this._charWidth,
                height: this._charHeight,
                color: this._fontColor,
                size: this._charHeight,
                string: this._gl.font
            },
            background: {
                color: this._backgroundColor
            }
        };
    }

    /** Puts a single charicter at the x,y location
     * 
     * @param x 
     * @param y 
     * @param c 
     */
    public put(x: number, y:number, c: string){
        if(c.length > 1)
            c = c.charAt(1);

        this._gl.fillStyle = this._fontColor;
        this._gl.font = this._fontFace;
        this._gl.fillText(c, (x+1)*this._charWidth, (y+2)*this._charHeight);
    }

    /** Prints the stirng at the current location of the system.
     * 
     * @param s 
     */
    public print(s: string){
        for(let i=0; i<s.length; i++) {
            let char = s.charAt(i);
            if(char == '\n' || char == '\r') {
                this.x = 0;
                this.y++;
            } else {
                this.put(this.x,this.y,char);
                this.x++;
                if(this.x > this.width) {
                    this.x = 0;
                    this.y++;
                }

                if(this.y > this.totalHeight()) {
                    this.grow();
                }
            }
        }
    }

    public renderView(v: View){
        this._gl.putImageData(v.render(), 0, v.top);
    }

    /** Key Press Event
     * 
     * @param event 
     */
    private onKeyPress(event:Event){
        this._system.event(Keyboard.getKeyCode(event));
    }

    /** Key Up Event
     * 
     * @param event 
     */
    private onKeyUp(event:Event){
        Keyboard.reportKeyUp(Keyboard.getKeyCode(event));
    }

    /** Key Down Event
     * 
     * Will override some browswer defaults.
     * 
     * @param event 
     */
    private onKeyDown(event:Event){
        let code = Keyboard.getKeyCode(event);
        Keyboard.reportKeyDown(code);

        if(this._overideKey.includes(code)){
            event.preventDefault();
            this.onKeyPress(event);
            //this.onKeyUp(event);
        }
    }
}