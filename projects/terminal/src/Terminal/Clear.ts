import App from "../App";
import System from "../System";

export default class Clear extends App {
    constructor(){
        super("clear", "Clears the terminal");
    }

    async main(system:System, args: Array<string>){
        switch (args[1]) {
            case "-h":
                this.help(system);
                break;

            case "-r":
                system.reset();
                break;

            default:
                for(let i=0; i<10; i++)
                    system.println("\n");
        }
    }

    help(system:System){
        system.println("clear : Clears the terminal");
        system.println("   -h : displays helpful information");
        system.println("   -r : instead of clearing the screen will reset the whole terminal.");
    }
};