/** Equations.ts
 * 
 * @author Alex Malotky
 * @date 6/26/2023
 */

/** Operations Charaters
 * 
 */
const OPERATIONS = [
    "+",
    "-",
    "/",
    "*",
    "^"
]

/** Numeric Characters
 * 
 */
const NUMERIC = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "."
]

/** Instructions Interface
 * 
 * Used to meaningfully print information to the user.
 */
export interface Instruction {
    title: string,
    list: Array<string|Instruction>
}

/** Parse Error
 * 
 * Used by Equation class to report an error when parsing the string.
 */
export class ParseError extends Error {
    public index: number;
    public msg: string;

    constructor(msg: string, index: number){
        super(msg + ": " + index);
        this.msg = msg;
        this.index = index;
    }
}

/** Equation Class
 * 
 */
export default class Equation{
    private valueStack: Array<Number|Equation>;
    private operationStack: Array<string>;

    private _instructions: Array<Instruction|string>;
    private _solution: number;

    constructor(s:string|Equation){
        this.valueStack = [];
        this.operationStack = [];
        this._instructions = [];
        this._solution = NaN;

        if(s instanceof Equation)
            s = s.toString();

        //remove whitespace & parse
        this.parseString(s.replace(/\s+/g, ""));

        //Check if everything is formated okay!
        if(this.operationStack.length + 1 !== this.valueStack.length)
            throw new Error("Malformed Equation!");

        this.solve();
    }

    /** Parse String
     * 
     * @param {string} s 
     */
    private parseString(s:string): void{
        let valueBuffer:string = "";
        let bracketCount: number = 0;

        for(let index:number = 0; index<s.length; index++){
            let char: string = s.charAt(index);

            //Value Buffer is a String
            if(bracketCount > 0){

                //Possible End of String
                if(char === ")"){

                    //Yes EOS
                    if(--bracketCount <= 0){
                        try {
                            this.valueStack.push(new Equation(valueBuffer));
                        } catch (e: any){
                            if(e instanceof ParseError){

                                //TODO: make index show correct value
                                throw new ParseError(e.msg, index);
                            } else {
                                throw new ParseError(`Unknown Error! "${e.message}"`, index);
                            }
                        }
                        
                        valueBuffer = "";

                    //No EOS
                    } else {
                        valueBuffer += char;
                    }
                } else {
                    valueBuffer += char;
                    if(char === "("){
                        bracketCount++;
                    }
                }

            //Value Buffer is Number
            } else {

                //Char Not a Number
                if(NUMERIC.indexOf(char) < 0){

                    //Make sure there is a value to operate on.
                    if(this.operationStack.length === this.valueStack.length){
                        if(valueBuffer !== ""){
                            let temp = new Number(valueBuffer);
                            if(isNaN(temp.valueOf())) {
                                throw new ParseError(`Malformed value "${valueBuffer}"`, index);
                            } else {
                                this.valueStack.push(temp);
                            }
                            valueBuffer = "";
                        } else if(char === "-"){
                            valueBuffer += char;
                        } else if(char !== "(") {
                            throw new ParseError(`Exected value before '${char}'`, index);
                        }
                    }

                    //Char Is Operation Character.
                    if(OPERATIONS.indexOf(char) > -1) {
                        if ( valueBuffer !== "-") {
                            this.operationStack.push(char);
                        }
                        
                    //Char Is Other Character.
                    } else {
                        if(char === "("){

                            //Implied Multiplication
                            if(this.operationStack.length+1 === this.valueStack.length)
                                this.operationStack.push("*");

                            bracketCount++;
                        } else if(char === ")"){
                            throw new ParseError("Unexpected ')'", index);
                        } else {
                            throw new ParseError(`Unknown char '${char}'`, index);
                        }
                    }

                //Char Is a Number
                } else {
                    //Add to value buffer.
                    valueBuffer += char;
                }
            }
        }

        //Flush Anyhting Remaining
        if(valueBuffer !== "") {
            this.valueStack.push(new Number(valueBuffer))
        }
    }

    /** Solve Stack
     * 
     */
    private solve(): void{
        if(this.valueStack.length === 1 && this.operationStack.length === 0){
            this._solution = this.valueStack[0].valueOf();
            this._instructions.push(`(${this._solution}) = ${this._solution}`);
            return;
        }

        let innerSolves:Array<Instruction> = [];
        
        let values: Array<number> = this.valueStack.map((value: Number|Equation) => {
            if(value instanceof Equation){
                innerSolves.push({
                    title: `( ${value.toString()} ) = ${value.valueOf()}`,
                    list: value._instructions
                });
            }
            return value.valueOf()
        });

        let operations = Array.from(this.operationStack);
        this._instructions.push({
            title: "Solve Parenthesis",
            list: innerSolves
        });

        //Exponents
        let solutions = [];
        let index = 0;
        while( index < operations.length){
            if(operations[index] === "^"){
                //Get Values
                let lhs = values[index];
                let rhs = values[index+1];

                //Do the Math
                values[index] = Math.pow(lhs, rhs);
                const output: string = `${lhs} ^ ${rhs} = ${values[index]}`;

                //Remove Used Values
                operations.splice(index, 1);
                values.splice(index+1, 1);
                
                //Print New Equation
                solutions.push(output + "\n" + Equation.createString(operations, values));
            } else {
                index++;
            }
        }
        this._instructions.push({
            title: "Solve Exponents",
            list: solutions.splice(0)
        });

        //Multiplication & Division
        index = 0;
        while( index < operations.length){
            if(operations[index] === "*"){
                //Get Values
                let lhs = values[index];
                let rhs = values[index+1];

                //Do the Math
                values[index] = lhs * rhs;
                const output: string = `${lhs} * ${rhs} = ${values[index]}`;

                //Remove Used Values
                operations.splice(index, 1);
                values.splice(index+1, 1);
                
                //Print New Equation
                solutions.push(output + "\n" + Equation.createString(operations, values));
            } else if(operations[index] === "/"){
                //Get Values
                let lhs = values[index];
                let rhs = values[index+1];

                //Do the Math
                values[index] = lhs / rhs;
                const output: string = `${lhs} / ${rhs} = ${values[index]}`;

                //Remove Used Values
                operations.splice(index, 1);
                values.splice(index+1, 1);

                //Print New Equation
                solutions.push(output + "\n" + Equation.createString(operations, values));
            } else {
                index++;
            }
        }
        this._instructions.push({
            title: "Solve Multiplication/Division",
            list: solutions.splice(0)
        });

        //Addition & Subtraction
        index = 0;
        while( index < operations.length){
            if(operations[index] === "+"){
                //Get Values
                let lhs = values[index];
                let rhs = values[index+1];

                //Do the Math
                values[index] = lhs + rhs;
                const output: string = `${lhs} + ${rhs} = ${values[index]}`;

                //Remove Used Values
                operations.splice(index, 1);
                values.splice(index+1, 1);

                //Print New Equation
                solutions.push(output + "\n" + Equation.createString(operations, values));
            } else if(operations[index] === "-"){
                //Get Values
                let lhs = values[index];
                let rhs = values[index+1];

                //Do the Math
                values[index] = lhs - rhs;
                const output: string = `${lhs} - ${rhs} = ${values[index]}`;

                //Remove Used Values
                operations.splice(index, 1);
                values.splice(index+1, 1);

                //Print New Equation
                solutions.push(output + "\n" + Equation.createString(operations, values));
            } else {
                index++;
            }
        }
        this._instructions.push({
            title: "Solve Addition/Subtraction",
            list: solutions.splice(0)
        });

        this._solution = values[0];
    }

    /** Create String
     * 
     * @param {Array<string>} operations 
     * @param {Array<Equation|Number>} values 
     * @returns {string}
     */
    private static createString(operations: Array<string>, values: Array<Number|Equation>): string{
        if(operations.length+1 !== values.length)
            return "Malformed Objects!";

        let index: number = 0;
        let output: string = "";

        while(index < operations.length){
            if(values[index] instanceof Equation){
                output += "( " + values[index].toString() + " ) ";
            } else {
                output += values[index].toString() + " ";
            }

            output+= operations[index++] + " ";
        }

        if(values[index] instanceof Equation){
            output += "( " + values[index].toString() + " ) ";
        } else {
            output += values[index].toString() + " ";
        }

        return output;
    }

    /** Create User Friendly String
     * 
     * @returns {string}
     */
    toString(): string{
        return Equation.createString(this.operationStack, this.valueStack);
    }

    /** Value of Solution
     * 
     * @returns {number}
     */
    valueOf(): number{
        return this._solution;
    }

    /** Instructions Getter
     * 
     */
    get instructions(): Array<Instruction|string>{
        return this._instructions;
    }
}