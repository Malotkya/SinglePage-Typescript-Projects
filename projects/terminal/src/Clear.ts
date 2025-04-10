import System, {App} from "./Terminal";

export default class Clear extends App {
    constructor(){
        super("clear", "Clears the terminal");
        
        this.main = (args) => {
            switch (args[1]) {
                case "-h":
                    this.help();
                    break;
    
                case "-r":
                    System.reset();
                    break;
    
                default:
                    for(let i=0; i<10; i++)
                        System.println("\n");
            }
        }

        this.help = () => {
            System.println("clear : Clears the terminal");
            System.println("   -h : displays helpful information");
            System.println("   -r : instead of clearing the screen will reset the whole terminal.");
        }
    }
};