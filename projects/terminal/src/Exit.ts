import System, {App} from "./Terminal";

export default class Exit extends App {
    constructor(){
        super("exit", "Closes the terminal");
    }

    async main(system:System, args: Array<string>){
        system.println("Good Bie!")
        system.close();
    }

    help(system: System){
        system.println("Use this to close the terminal.");
    }
};