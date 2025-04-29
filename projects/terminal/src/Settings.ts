import System, {App} from "./System"
import Defaults from './System/Registry/Defaults';
import Registry, {RegisterKey, RegisterType, SystemSettingsName} from './System/Registry';
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
        const list:{name:RegisterKey, value:RegisterType}[] = [];
        for(const name in Defaults){
            list.push({
                name,
                value: Defaults[name as SystemSettingsName]
            });
        }
        Registry.batch(list);
    }

    change(att:SystemSettingsName|string, value:string){
        switch(att) {
        case "Background_Color":
        case "Font_Color":
            try {
                Registry.set(att, Color.from(value));
            } catch (e:any) {
                return `TypeError: ${value} is not a color!`;
            }
            break;

        case "Font_Size":
        case "Screen_Width":
        case "Screen_Height":
            let n = Number(value);
            if(isNaN(n)) {
                return `TypeError: ${value} is not a number!`;
            } else {
                Registry.set(att, n);
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