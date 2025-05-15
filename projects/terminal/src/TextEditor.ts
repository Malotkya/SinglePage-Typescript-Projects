import System, { App } from "./System";
import { FileError } from "./System/Files/Errors";
import { relative } from "./System/Files/Path";
import fs from "./System/Files";
import { InputBuffer } from "./System/Stream/IO";

export default class TextEditor extends App {
    constructor(){
        super("edit", "Edit text files");

        this.main = async(args) => {
            const encoding = args.get("-e");
            const path = args[2] || args[1];

            if(path === undefined) {
                System.println("No filename specified!");
                return;
            }

            const buffer = new InputBuffer({value:""});
            try {
                buffer.value = (await fs.readfile(relative(path))).Text(encoding);
            } catch (e){
                if( !(e instanceof FileError) ) {
                    System.println(e);
                    return;
                }
            }

            const view = System.getView();
            
            view.on("keyboard", (e)=>{
                const {key, value} = e.detail;
                switch(key){
                    case "ControlLeft":
                    case "ControlRight":
                        if(view.Keyboard.isKeyPressed("KeyC"))
                            view.close();
                        break;

                    default:
                        buffer.keyboard(key, value);
                }
            });

            view.on("render", (e)=>{
                view.print(0, 0, buffer.value, buffer.cursor);
            });

            return view.wait();
        }
    }
}