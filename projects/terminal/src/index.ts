import System, {start, clear} from "./Terminal";
import { FileSystem, init } from "./Terminal/FileSystem";
import Help from "./Help";
import SettingsApp from "./Settings";
import Snake from "./Snake";



for(const call in FileSystem){
    const {desc, main} = FileSystem[call];
    System.addFunction(call, desc, main);
}

System.addFunction("about", "Displays more information about the terminal app.", ()=>{
    System.println("This is an attempt to see what I can create in this environement.");
    System.println("I plan to continue to expand the functionality of thie terminal");
    System.println("Goals Include:");
    System.println("[*]: Change the terminal to be desplayed using 2D Graphics.");
    System.println("[*]: Add automatic scrolling functionality");
    System.println("[*]: Persist Settings");
    System.println("[*]: Create a basic game like snake");
    System.println("[*]: Rework Settings into a System Registry (Local Storage or IDB");
    System.println("[ ]: Create Basic File System & User Seperation / Login (IDB)");
});
System.addFunction("clear", "Clears the terminal.", (args)=>clear(args[1]));
System.addFunction("exit", "Closes the terminal.", ()=>{
    System.println("Good Bie!")
    System.close();
});

System.addApp(new Help());
System.addApp(new SettingsApp());
System.addApp(new Snake());

window.onload = async() => {
    await init();
    await start();
}

