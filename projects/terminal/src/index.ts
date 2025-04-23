import System, {start, clear, App} from "./Terminal";
import Help from "./Help";
import SettingsApp from "./Settings";

System.addFunction("clear", "Clears the terminal.", (args)=>clear(args[1]));
System.addFunction("about", "Displays more information about the terminal app.", ()=>{
    System.println("This is an attempt to see what I can create in this environement.");
    System.println("I plan to continue to expand the functionality of thie terminal");
    System.println("Goals Include:");
    System.println("[*]: Change the terminal to be desplayed using 2D Graphics.");
    System.println("[*]: Add automatic scrolling functionality");
    System.println("[*]: Persist Settings");
    System.println("[*]: Create a basic game like snake");
    System.println("[ ]: Rework Settings into a System Registry (Local Storage or IDB");
    System.println("[ ]: Create Basic File System & User Seperation / Login (IDB)");
});
System.addFunction("exit", "Closes the terminal.", ()=>{
    System.println("Good Bie!")
    System.close();
});

interface Position {
    x:number
    y:number
}

class Snake extends App {
    constructor(){
        super("snake", "A snake game");
        
        this.main = () => {
            const view = System.getView();

            const maxX = Math.floor(view.width / view.font.width) - 2;
            const maxY = Math.floor(view.height / view.font.height) - 3;

            let timeoutId:number|undefined;
            let direction:"Up"|"Down"|"Left"|"Right" = "Up";
            let errorMessage:string = "Press Space to Start";
            let snake:Position[] = [];
            let food:Position = {x:-1, y:-1};
            let speed:number = 500;
            let maxScore:number = 0;

            const start = () => {
                const cX = Math.ceil(maxX / 2);
                const cY = Math.ceil(maxY / 2);
                direction ="Up";
                snake = [{x:cX, y:cY}, {x:cX, y:cY+1}];
                food = randPos();
                errorMessage = "";
                gameLoop();
            }

            const collision = (p:Position) => {
                if(p.y < 1 || p.y >= maxY) {
                    return true;
                }
                    

                if(p.x < 1 || p.x >= maxX) {
                    return true;
                }

                for(const s of snake){
                    if(s.x === p.x && s.y === p.y) {
                        return true;
                    }
                        
                }

                return false;
            }

            const randPos = () => {
                const available:Position[] = [];
                for(let x=0; x<maxX; x++) {
                    for(let y=1; y<maxY; y++){
                        const p = {x, y}
                        if(!collision(p))
                            available.push(p);
                    }
                }

                if(available.length === 0)
                    return {x:-1, y:-1};

                const index = Math.floor(Math.random() * available.length);
                return available[index];
            }

            const gameLoop = () => {
                const head:Position = JSON.parse(JSON.stringify(snake[0]));
                switch(direction){
                    case "Up":
                        head.y -= 1;
                        break;
                    
                    case "Down":
                        head.y += 1;
                        break;

                    case "Left":
                        head.x -= 1;
                        break;

                    case "Right":
                        head.x += 1;
                        break;
                }

                if(collision(head)){
                    errorMessage = "Game Over!";
                    maxScore = Math.max(maxScore, snake.length);
                } else if(head.x === food.x && head.y === food.y) {
                    food = randPos();
                } else {
                    snake.pop();
                }

                if(errorMessage === "") {
                    snake.unshift(head);
                    timeoutId = window.setTimeout(gameLoop, speed);
                }  
            }

            view.on("render", (e)=>{
                e.preventDefault();
                view.clear();

                view.print(food.x, food.y, "*");
                for(const p of snake){
                    view.print(p.x, p.y, "O");
                }

                view.print(0, 0, `XX  Use WASD/Arrow Keys to move | Space to Start | Esc to Quit |  Score ${snake.length}  `.padEnd(maxX+1, "X"));
                for(let i=1; i<maxY; i++) {
                    view.print(0, i, "X");
                    view.print(maxX, i, "X");
                }
                view.print(0, maxY, "XX  Change speed of snake by pressing number key: 1 = slowest  9 = fastest  ".padEnd(maxX+1, "X"));
                if(errorMessage)
                    view.print(Math.floor((maxX - errorMessage.length)/2), Math.floor(maxY / 2), errorMessage);
            });

            view.on("keyboard", (e)=>{
                const {key, value} = e.detail;
                switch(key){
                    case "Escape":
                        view.close();
                        break;

                    case "ArrowUp":
                    case "KeyW":
                        direction = "Up";
                        break;

                    case "ArrowDown":
                    case "KeyS":
                        direction = "Down";
                        break;

                    case "ArrowLeft":
                    case "KeyA":
                        direction = "Left";
                        break;

                    case "ArrowRight":
                    case "KeyD":
                        direction = "Right";
                        break;

                    case "Space":
                        start();
                        break;

                    default:
                        const n = Number(value);
                        if(!isNaN(n))
                            speed = (10 - n) * 100;

                }
            });

            view.on("close", ()=>{
                window.clearTimeout(timeoutId);
                System.println("Max score: " + maxScore);
            })

            return view.wait();
        }
    }
}

System.addApp(new Help());
System.addApp(new SettingsApp());
System.addApp(new Snake());

window.onload = () => start();

