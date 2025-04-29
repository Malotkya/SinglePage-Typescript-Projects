/** /Terminal/Arguments
 * 
 * @author Alex Malotky
 */

/** Unescape Special Character
 * 
 * example: n => newline
 *          t => tab
 *          " => "
 * 
 * @param {string} value 
 * @returns {string}
 */
function unescape(value:string):string {
    return JSON.parse(`"\\${value.charAt(0)}"`);
}

/** Resolve string
 * 
 * @param {string} value 
 * @return {string}
 */
function resolve(value:string):string {
    const match = value.match(/^['"`](.*?)['"`]$/);

    if(match === null)
        return value;

    return match[1];
}

/** Insert Help Function
 * 
 * @param {map} map 
 * @param {string} value 
 */
function insert(map:Map<string, string>, value:string){
    const list = value.split("=");
    let name:string;
    if(list.length > 1) {
        name = list.shift()!;
        value = list.join("=");
    } else {
        name = value;
        value = "";
    }

    map.set(name, resolve(value));
}

/** Arguments
 * 
 * Helper class to get arguments and commands from a string
 * 
 */
export default class Arguments extends Array<string> {
    #values:Map<string, string>;
    readonly value:string;

    constructor(value:string){
        super();
        this.#values = new Map();
        this.value = value;

        let quotes:string|null = null;
        let current:string = "";
        let escaped:boolean = false;

        for(const char of value){
            if(escaped) {
                current += unescape(char);
                escaped = false;
                continue;
            }

            switch(char){
                case "'":
                    if(quotes === "single") {
                        quotes = null;
                    } else if(quotes === null){
                        quotes = "single";
                    }
                    current += char;
                    break;

                case '"':
                    if(quotes === "double") {
                        quotes = null;
                    } else if(quotes === null){
                        quotes = "double";
                    }
                    current += char;
                    break;
                
                case "`":
                    if(quotes === "back") {
                        quotes = null;
                    } else if(quotes === null){
                        quotes = "back";
                    }
                    current += char;
                    break;

                case "\\":
                    escaped = true;
                    break;

                default:
                    if(quotes) {
                        current += char
                    } else {
                        if(char.match(/\s/) && current) {
                            this.push(current);
                            insert(this.#values, current);
                            current = "";
                        } else {
                            current += char
                        }
                    } 
            }
        } //End For

        if(current){
            this.push(current);
            insert(this.#values, current);
        }
    }

    /** Get Set Value
     * 
     * @param {string} name 
     * @returns {string|undefined}
     */
    get(name:string):string|undefined {
        return this.#values.get(name);
    }

    /** Set Values Iterator
     * 
     * @returns {MapIterator}
     */
    //@ts-ignore
    values(): MapIterator<[string, string]> {
        return this.#values.entries();
    }

    toString() {
        return this.value;
    }
}