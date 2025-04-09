import App from "../App";
import System from "../System";

import Help from "./Help";
import About from "./About";
import Clear from "./Clear";
import Exit from "./Exit";

export default class Termianl extends App{
    private _running: boolean;
    private _system: System;

    constructor(system:System){
        super("undefined", "undefined");

        this._running = true;
        this._system = system;

        system.addApp(new Help());
        system.addApp(new Clear());
        system.addApp(new Exit());
        system.addApp(new About());
        system.addApp(system.getSettingsApp());

        system.callstack.push(this);
    }

    async main(system:System, args: Array<string>){
        while(this._running){
            system.print("\n$: ");
            let input = await system.getln();

            let cmd = input.split(/\s+/gm);
            this.addToHistory(input);

            let app = this._system.getApp(cmd[0]);

            if(app){
                system.callstack.push(app);
                await system.run(cmd);
                system.callstack.pop();
            } else {
                system.println("Unknown Command!");
            }
        }
    }

    run(){
        this._system.run([]).catch(console.error);
    }
}