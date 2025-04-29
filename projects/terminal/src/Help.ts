import System, {App, Process} from "./System";

class Help extends App {
    constructor(){
        super("help", "I try to help out how ever I can");

        this.main = async(args) => {
            if(args[1] === undefined) {

                for(const [name, app] of System) {
                    if(app.description)
                        System.println(`${name} - ${app.description}`);
                }
            } else {
                let app:Process|null = null;
                let intrusive = (args[1] == "-i")
                if(intrusive) {
                    app = System.getProcess(args[2].toLowerCase());
                } else {
                    app = System.getProcess(args[1].toLowerCase());
                }
    
                if(typeof app?.help === "function") {
                    await app.help();
                } else {
                    System.println("Sorry, I don't know that application.");
                }
            }
        }
    }
};

export default Help;