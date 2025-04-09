import { createElement as _, appendContent, Content } from "@/Element";
import Equation, {ParseError} from "./Equation";

window.onload = () => {

    const txtInput: HTMLInputElement|null = document.querySelector("#txtInput");
    const btnSolve: HTMLButtonElement|null = document.querySelector("#btnSolve");
    const target: HTMLElement|null = document.querySelector("#target");

    if(txtInput && btnSolve && target){
        btnSolve.addEventListener("click", event=>{
            event.preventDefault();
            event.stopPropagation();

            target.innerHTML = "";
            
            parseInput(txtInput.value)
                .then((eq:Equation)=>{
                    printEquation(eq, target);
                }).catch((error:any)=>{
                    printError(error, target);
                });
        });
    } else {
        alert("Critical Failure: Unable to find Elements!");
    }
}

/** Parse Input
 * 
 * Wraps Equation Construtor with Promise.
 * 
 * @param {string} s 
 * @returns {Equation}
 */
function parseInput(s:string): Promise<Equation>{
    return new Promise((resolve, reject)=>{
        try{
            resolve(new Equation(s));
        } catch(e){
            reject(e);
        }
    });
}

/** Print Error
 * 
 * @param {any} error 
 * @param {HTMLElement} target 
 */
function printError(error:any, target:HTMLElement): void{
    const section = document.createElement("section");
    section.className = "error";

    if(error instanceof ParseError) {
        //TODO: print more meaningful informaiton.
        section.textContent = error.message;
    } else if (error instanceof Error){
        section.textContent = error.message;
    } else {
        section.textContent = error;
    }

    target.appendChild(section);
    console.error(error);
}

/** Print Equation
 * 
 * Wrapper for recursive print Instruction
 * 
 * @param {Equation} eq 
 */
function printEquation(eq:Equation, target:HTMLElement): void{
    target.appendChild(_("h2", `${eq.toString()} = ${eq.valueOf()}`));
    appendContent(target, printInstruction(eq.instructions));
}

/** Print Instruction
 * 
 * Formats instructions into html elements.
 * 
 * @param {any} i - Instruction/Array/String
 * @param {Boolean} skipEmpty 
 * @returns {HTMLElement|null}
 */
function printInstruction(i:any, skipEmpty:boolean = false): HTMLElement|null{
    
    //instanceof Instruction
    if(typeof i?.title === "string" && i?.list instanceof Array){

        if( !(skipEmpty && i.list.length <= 0) ){
            const section = document.createElement("section");

            const title = document.createElement("h3");
            title.textContent = i.title;
            section.appendChild(title);

            if(i.list.length === 0){
                title.innerHTML += ": <i>none</i>";
            } else {
                appendContent(section, printInstruction(i.list, true))
            }

            return section;
        }

       return null;

    //instanceof Array
    } else if(i instanceof Array){

        if( !(skipEmpty && i.length <= 0) ){
            const list = document.createElement("ul");

            i.forEach( (item:any) => {
                const value = printInstruction(item, true);
                if(value !== null) {
                    const li = document.createElement("li");
                    li.appendChild(value);
                    list.appendChild(li);
                }
            });
    
            return list;
        }
       
        return null;

    //instanceof string
    } else {
        const section = document.createElement("p");
        section.innerText = i;
        return section;
    }
}