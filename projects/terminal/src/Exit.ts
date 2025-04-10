import System, {App} from "./Terminal";

export default class Exit extends App {
    constructor(){
        super("exit", "Closes the terminal");

        this.main = () => {
            System.println("Good Bie!")
            System.close();
        }
        
        this.help = () => {
            System.println("Use this to close the terminal.");
        }
    }
};