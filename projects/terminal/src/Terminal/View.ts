import {ViewTemplate} from "./Bios";

export default class View {
    private _ctx: CanvasRenderingContext2D;

    private _fontColor: string;
    private _backgroundColor: string;
    private _cw: number;
    private _ch: number;
    private _width: number;
    private _height: number;

    private _top: number;

    private _lastRender: ImageData|undefined;

    constructor(template: ViewTemplate){
        let canvas = document.createElement("canvas");

        canvas.width = template.size.width * template.font.width;
        canvas.height = template.size.height * template.font.height;
        canvas.style.zIndex = "-1";
        canvas.style.position = "abosulte";
        canvas.style.top = "0";
        canvas .style.left = "0";

        let context = canvas.getContext("2d");
        if(context === null)
            throw new Error("There was a problem creating the view object!");

        this._ctx = context;
        this._ctx.fillStyle = template.font.color;
        this._ctx.font = template.font.string;

        this._fontColor = template.font.color;
        this._backgroundColor = template.background.color;
        this._ch = template.font.height;
        this._cw = template.font.width;
        this._width = template.size.width;
        this._height = template.size.height;

        this._top = template.top;

        document.body.appendChild(canvas);
        this._lastRender = undefined;
    }

    get running(){
        return typeof this._lastRender === "undefined";
    }

    get width(){
        return this._width;
    }

    get height(){
        return this._height;
    }

    output(x:number, y:number, s: string){
        this._ctx.fillStyle = this._fontColor;
        this._ctx.fillText(s, (x-1)*this._cw, y*this._ch);
    }

    clear(){
        this._ctx.fillStyle = this._backgroundColor;
        this._ctx.fillRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);
    }

    async open(){
        if(this.running){
            await this.sleep();
            this.clear();
        }
        return this.running;
    }

    sleep() {
        return new Promise(r => window.setTimeout(r, 1));
    }

    render(){
        if(this._lastRender){
            return this._lastRender;
        }

        return this._ctx.getImageData(0,0,this._ctx.canvas.width, this._ctx.canvas.height);
    }

    close(){
        this._lastRender = this._ctx.getImageData(0,0,this._ctx.canvas.width, this._ctx.canvas.height);
    }

    delete(){
        this.close();
        this._ctx.canvas.remove();
    }

    test(){
        for(let x=1; x<=this.width; x++){
            for(let y=1; y<this.height; y++){
                this.output(x,y, Math.floor(Math.random()*10).toString());
            }
        }
    }

    get top(){
        return this._top;
    }
}