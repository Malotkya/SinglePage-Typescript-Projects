import System, {App} from "./Terminal";

class Help extends App {
    constructor(){
        super("help", "I try to help out how ever I can");

        this.main = (args) => {
            if(args[1] === undefined) {

                for(const [name, app] of System) {
                    if(app.description !== undefined)
                        System.println(`${name} - ${app.description}`);
                }
            } else {
                let app = null;
                let intrusive = (args[1] == "-i")
                if(intrusive) {
                    app = System.getApp(args[2].toLowerCase());
                } else {
                    app = System.getApp(args[1].toLowerCase());
                }
    
                if(typeof app?.help === "function") {
                    app.help();
                } else {
                    System.println("Sorry, I don't know that application.");
                }
            }
        }
    }
};

export default Help;