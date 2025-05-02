/** /System/Register/ConfigFile.ts
 * 
 */
import fs from "../Files";
import { ReadWriteFileStream } from "../Stream/File";
import { regexSplit } from "@";

//Parsing Regex
const NameRegex = /^(\s*\[)(.+)(\].*?)$/;
const LineRegex =/^(.*?)=(.*?)(;.*?)$/;

/** Config Parsing Error
 * 
 */
export class ConfigError extends Error{
    readonly line:number;

    constructor(line:number, message:string){
        super(message);
        this.line = line;
    }
}

/** COnfig Value
 * 
 */
export type ConfigValue = string|number|boolean;

/** Get Config Value
 * 
 * @param {string} value 
 * @returns {ConfigValue}
 */
function getValue(value:string):ConfigValue {
    try {
        return JSON.parse(value);
    } catch (e){
        return value.trim();
    }
}

/** Config Section Type
 * 
 */
export type ConfigSection = Record<string, ConfigValue>;

//Config Section Interfaces
interface SectionName<N extends string>{
    prefix: string
    value: N
    postfix: string
}
interface SectionValue<K extends string, V extends ConfigValue> {
    key: K
    value: V
    postfix: string
}

/** Parse Section Line
 * 
 * @param {string} s 
 * @param {index} i 
 * @returns {SectionValue|string}
 */
function parseLine(s:string, i:number):string|SectionValue<any, any>{
    const match = s.match(LineRegex);
    if(match === null) {
        switch(s.trim().charAt(0)){
            case "":
            case ";":
                return s;

            default:
                throw new ConfigError(i+1, 'Unable to parse line!');
        }
    }
        
    return {
        key: match[1],
        value: getValue(match[2]),
        postfix: match[3]
    }
}

/** Config Section Class
 * 
 */
export class Section<N extends string, T extends ConfigSection>{
    private _name:SectionName<N>;
    private _value:Array<string|SectionValue<any, any>>;
    private _c:Function;

    constructor(lines:string[], callback:Function) {
        const name = lines.shift();
        if(name === undefined)
            throw new TypeError("No Name Line!");

        const match = name.match(NameRegex);
        if(match === null)
            throw new ConfigError(0, "Unable to parse name line!");

        this._name = {
            prefix: name[1],
            value: name[2] as N,
            postfix: name[3]
        };

        this._value = lines.map(parseLine);
        this._c = callback;
    }

    get name():string {
        return this._name.value;
    }

    set<K extends (keyof T)|string>(key:K, value:T[K] extends ConfigValue? T[K]: never) {
        for(const line of this._value){
            if(typeof line === "object" && line.key.trim() === key){
                line.value = value;
                this._c()
                return;
            }
        }

        this._value.push({
            key, value,
            postfix: ""
        });
        this._c();
    }

    get<K extends (keyof T)|string>(key:K):T[K] extends ConfigValue? T[K]: undefined {
        for(const line of this._value){
            if(typeof line === "object" && line.key.trim() === key)
                return line.value;
        }

        return undefined as any;
    }

    toString():string {
        return this._name.prefix + this._name.value + this._name.postfix + "\n"
            + this._value.map(line=>{
                if(typeof line === "object")
                    return line.key + "=" + line.value + " " + line.postfix;

                return line;
            }).join("\n");
    }
}

/** Global Config Type
 * 
 */
export type GlobalConfig = Record<string, ConfigSection|ConfigValue>;

/** Config File Class
 * 
 */
export class ConfigFile<T extends GlobalConfig> {
    private _file:ReadWriteFileStream
    private _value:Array<string|SectionValue<any, any>|Section<any, any>>;

    constructor(file:ReadWriteFileStream){
        this._file = file;
        this._file.mode = "Rewrite";
        this._value = [];

        file.onUpdate(()=>this.init());
    }

    init(){
        const lines = regexSplit(this._file.buffer, /\n/);
        let [start, name] = nextSection(lines);
        this._value = start.map(parseLine);

        while(lines.length > 0){
            const [data, nextName] = nextSection(lines);
            data.unshift(name);
            this._value.push(new Section(data, ()=>this.update()));
            name = nextName;
        }
    }

    get<K extends (keyof T)&string>(key:K):T[K] extends ConfigSection? Section<K, T[K]>: T[K] extends ConfigValue? T[K]: undefined {
        for(const line of this._value){
            if(line instanceof Section) {
                if(line.name === key)
                    return line as any;
            } else if(typeof line === "object") {
                if(line.key.trim() === key)
                    return line as any;
            }
        }

        return undefined as any;
    }

    set<K extends (keyof T)|string>(key:K, value:T[K] extends ConfigValue? T[K]: never) {
        if(value instanceof Section)
            throw new Error("Cannot set sections to ConfigFile!");

        for(const line of this._value) {
            if(line instanceof Section)
                throw new Error("Cannot update sections in ConfigFile!\nInstead user getter and update current Section.");
            else if(typeof line === "object" && line.key === key) {
                line.value = value;
                this.update();
                return;
            }
        }

        if(value instanceof Section){
            this._value.push(value);
        } else {
            this._value.push({
                key, value,
                postfix: ""
            });
        }
        this.update();
    }

    toString(){
        return this._value.map(line=>{
            if(line instanceof Section)
                return Section.toString();
            else if(typeof line === "object")
                return line.key + "=" + line.value + " " + line.postfix;

            return line;
        }).join("\n");
    }

    update() {
        this._file.write(this.toString());
    }
}



/** Next Section Helper Function
 * 
 * @param {string[]} lines 
 * @returns {[string[], string]}
 */
function nextSection(lines:string[]):[lines:string[], name:string] {
    const output:string[] = [];
    let name:string = "";
    let current:string|undefined = lines.shift();

    while(current){
        if(current.trim().charAt(0) == "[") {
            name = current;
            break;
        }

        output.push(current);
        current = lines.shift();
    }


    return [output, name];
}


/** Get Congfig File
 * 
 * @param {string} path 
 * @returns {Promise<ConfigFile>}
 */
export default async function OpenConfigFile<T extends GlobalConfig>(path:string):Promise<ConfigFile<T>> {
    return new ConfigFile(await fs.openfile(path, "ReadWrite", "Rewrite"));
}