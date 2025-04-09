import App from "../App";
import System from "../System";

export default class About extends App {
    constructor(){
        super("about", "Displays more information about the terminal app");
    }

    async main(system:System, args: Array<string>){
        system.println("This is an attempt to see what I can create in this environement.");
        system.println("I plan to continue to expand the functionality of thie terminal");
        system.println("Goals Include:");
        system.println("[*]: Change the terminal to be desplayed using 2D Graphics.");
        system.println("[ ]: Add automatic scrolling functionality");
        system.println("[ ]: Persist Settings");
        system.println("[ ]: Create a basic game like snake");
    }

    help(system:System){
        system.println("Do you really nead help with reading the about section?");
    }
};