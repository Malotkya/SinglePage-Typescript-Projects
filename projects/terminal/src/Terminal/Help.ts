import App from "../App";
import System from "../System"

class Help extends App {
    constructor(){
        super("help", "I try to help out how ever I can");
    }

    async main(system:System, args: Array<string>){
        if(args[1] === undefined) {

            for(const key of system) {
                let app = system.getApp(key)!;
                if(app.description !== undefined)
                    system.println(`${key} - ${app.description}`);
            }
        } else {
            let app = null;
            let intrusive = (args[1] == "-i")
            if(intrusive) {
                app = system.getApp(args[2].toLowerCase());
            } else {
                app = system.getApp(args[1].toLowerCase());
            }

            if(typeof app?.help === "function") {
                app.help(system);
            } else {
                system.println("Sorry, I don't know that application.");
            }
        }
    }

    help(system:System){
        system.println("Holla Mundo!");
    }
};

export default Help;