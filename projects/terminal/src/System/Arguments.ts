/** /System/Arguments
 * 
 * @author Alex Malotky
 */
import { regexSplit } from "@";

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

        for(const line of regexSplit(value, /\s/)) {
            this.push(line);
            insert(this.#values, line);
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