import App from '../App';
import System from "../System"
import Bios from '../System/Bios.wait';
import * as Default from '../System/Defaults';

class Settings extends App {
    private _bios: any;
    private _loop: boolean;

    constructor(bios: any) {
        super("settings", "Changes things like screen dimensions or colors");

        this._bios = bios;
        this._loop = false;
    }

    help(system:System){
        system.println("Comming Soon!");
    }

    async main(system:System, args: Array<string>){

        if(args[1] === undefined) {
            this._loop = true;
        } else {
            switch(args[1].toLowerCase()) {
            case "set":
                system.println( this.change(args[2], args[3]) );
                break;
            case "reset":
                this.reset();
                system.println("Success!");
                break;
            default:
                system.println("Unknown command: " + args[1]);
            }
        }

        if(this._loop)
            await this.run(system);

        this._loop = false;
    }

    async run(system:System) {
        let input = (await system.get()).toLowerCase();
        while(input !== "exit") {
            switch (input) {
                case "reset":
                    this.reset();
                    system.println( "Success!" );
                break;

                case "set":
                let attribute = (await system.get()).toLowerCase();
                let value = (await system.get()).toLowerCase();
                system.println( this.change(attribute, value) );
                break;

                default:
                    system.println("Unknown command: " + input);
            }

            input = (await system.get()).toLowerCase();
        }
    }

    reset = () => {
        this._bios.width = Default.SCREEN_WIDTH;
        this._bios.height = Default.SCREEN_HEIGHT;
        //this._bios.setBackGroundColor(Default.COLOR_BACKGROUND);
        //this._bios.setFontColor(Default.COLOR_FONT);
        this._bios.size = Default.FONT_SIZE;
    }

    change(att:string, value:string){
        switch(att) {
        case "background-color":
            //this.bios.setBackGroundColor(value);
            return "Comming Soon!"
            break;
        case "font-color":
            //this._bios.setFontColor(value);
            return "Comming Soon!"
            break;
        case "font-size":
            this._bios.size = Number(value);
            break;
        case "screen-width":
            this._bios.width = Number(value);
            this._bios.grow(true);
            break;
        case "screen-height":
            this._bios.height = Number(value);
            break;
        default:
            return "Unknown Attribute: " + att;
        }

        return "Success!";
    }

    render(bios:any){
        /*if(this.loop) {

        }
        return this.loop;*/
        return false;
    }
}

export default Settings;