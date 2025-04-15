import App from '../App';
import System from ".."
import Defaults from './Defaults';
import { saveValue, SettingsName } from '.';
import Color from '@/Color';

export default class SettingsApp extends App {
    private _loop: boolean;

    constructor() {
        super("settings", "Changes things like screen dimensions or colors");

        this._loop = false;

        this.help = () => {
            System.println("Comming Soon!");
        }

        this.main = async(args) => {
            if(args[1] === undefined) {
                this._loop = true;
                await this.run();
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
        for(const name in Defaults){
            saveValue(name as SettingsName, Defaults[name as SettingsName]);
        }
    }

    change(att:string, value:string){
        switch(att) {
        case "background-color":
            try {
                saveValue("background-color", Color.from(value));
            } catch (e:any) {
                return `TypeError: ${value} is not a color!`;
            }
            break;
            
        case "font-color":
            try {
                saveValue("font-color", Color.from(value));
            } catch (e:any) {
                return `TypeError: ${value} is not a color!`;
            }
            break;

        case "font-size": 
            let size = Number(value);
            if(isNaN(size)) {
                return `TypeError: ${value} is not a number!`;
            } else {
                saveValue("font-size", size);
            }
            break;

        case "screen-width":
            let width = Number(value);
            if(isNaN(width)) {
                return `TypeError: ${value} is not a number!`;
            } else {
                saveValue("width", width);
            }
            break;

        case "screen-height":
            let height = Number(value);
            if(isNaN(height)) {
                return `TypeError: ${value} is not a number!`;
            } else {
                saveValue("width", height);
            }
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