import App from './Terminal/App';
import System from "./Terminal"
import {BiosType} from './Terminal/Bios';
import * as Default from './Terminal/Defaults';

class Settings extends App {
    private _bios: BiosType;
    private _loop: boolean;

    constructor(bios: BiosType) {
        super("settings", "Changes things like screen dimensions or colors");

        this._bios = bios;
        this._loop = false;

        this.help = () => {
            System.println("Comming Soon!");
        }

        this.main = async(args) => {
            if(args[1] === undefined) {
                this._loop = true;
            } else {
                switch(args[1].toLowerCase()) {
                case "set":
                    System.println( this.change(args[2], args[3]) );
                    break;
                case "reset":
                    this.reset();
                    System.println("Success!");
                    break;
                default:
                    System.println("Unknown command: " + args[1]);
                }
            }
    
            if(this._loop)
                await this.run();
    
            this._loop = false;
        }
    }

    async run() {
        let input = (await System.get("\s")).toLowerCase();
        while(input !== "exit") {
            switch (input) {
                case "reset":
                    this.reset();
                    System.println( "Success!" );
                break;

                case "set":
                let attribute = (await System.get("\s")).toLowerCase();
                let value = (await System.get("\s")).toLowerCase();
                System.println( this.change(attribute, value) );
                break;

                default:
                    System.println("Unknown command: " + input);
            }

            input = (await System.get("\s")).toLowerCase();
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