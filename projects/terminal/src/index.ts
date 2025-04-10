import System, {start, clear} from "./Terminal";
import Help from "./Help";
import Settings from "./Settings";

System.addFunction("clear", "Clears the terminal.", clear);
System.addFunction("about", "Displays more information about the terminal app.", ()=>{
    System.println("This is an attempt to see what I can create in this environement.");
    System.println("I plan to continue to expand the functionality of thie terminal");
    System.println("Goals Include:");
    System.println("[*]: Change the terminal to be desplayed using 2D Graphics.");
    System.println("[ ]: Add automatic scrolling functionality");
    System.println("[ ]: Persist Settings");
    System.println("[ ]: Create a basic game like snake");
});
System.addFunction("exit", "Closes the terminal.", ()=>{
    System.println("Good Bie!")
    System.close();
});

System.addApp(new Help());
//System.addApp(new Settings());

window.onload = () => start();