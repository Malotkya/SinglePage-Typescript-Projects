import System, {App} from "./Terminal";

export default class About extends App {
    constructor(){
        super("about", "Displays more information about the terminal app");
        this.main = () => {
            System.println("This is an attempt to see what I can create in this environement.");
            System.println("I plan to continue to expand the functionality of thie terminal");
            System.println("Goals Include:");
            System.println("[*]: Change the terminal to be desplayed using 2D Graphics.");
            System.println("[ ]: Add automatic scrolling functionality");
            System.println("[ ]: Persist Settings");
            System.println("[ ]: Create a basic game like snake");
        }

        this.help = () => {
            System.println("Do you really nead help with reading the about section?");
        }
    }
};