/** /Terminal/Register
 * 
 * These are the default constants that will be used by the app.  If there are
 * settings saved in a cookie those will be used instead.
 * 
 * @author Alex Malotky
 */
import { SystemRegisterKey, SystemRegisterMap, RegisterMap, SystemRegisterTypeMap, RegisterType, RegisterTypeKey, RegisterKey } from "./types";
import { SystemRegister, isSystemRegisterKey, isResterTypeKey, SystemRegisterKeys, extractType } from "./types";
import Color from "@/Color";
import {storageListener} from "@/Storage";
import Defaults from "./Defaults";

export type {SystemRegisterKey as SystemSettingsName, SystemRegisterTypeMap as SystemSettingsMap, RegisterType, RegisterKey}

const REGISTER_KEY = "System:Registry";

interface RegisterStoreValue {
    type: RegisterTypeKey,
    value: string
}

type Register = SystemRegisterTypeMap & {
    [K in string]: RegisterType
};

/** Get Register Type from Regsiter Store Value
 * 
 * @param {RegisterStoreValue} store 
 * @returns {RegisterType}
 */
function fromRegisterStoreValue<T extends RegisterTypeKey>(store:RegisterStoreValue):RegisterMap[T] {
    switch(store.type){
        case "color":
            return Color.from(store.value) as RegisterMap[T];

        case "number":
            return Number(store.value) as RegisterMap[T];

        case "bool":
            return (store.value.toLocaleUpperCase() === "TRUE" || store.value === "1") as RegisterMap[T];

        case "string":
            return store.value as RegisterMap[T];

        default:
            throw new Error(`Unknown type '${store.type}'`);
    }
}

/** Get Regsiter Store Value from Regsiter Type
 * 
 * @param {RegisterType} value 
 * @returns {RegisterStoreValue}
 */
function toRegisterStoreValue(value:RegisterType):RegisterStoreValue{
    let type = extractType(value);
    if(type !== "string") {
        if(typeof type.toString !== "function")
            throw new Error(`Unkown Rester Type: ${type}!`);

        return {
            type: type,
            value: value.toString()
        }
    }

    return {
        type: type,
        value: value as string
    }
}

/** Get Register from Local Storage or String
 * 
 * @param {string} string 
 * @returns {Register}
 */
function getRegister(string:string|null = localStorage.getItem(REGISTER_KEY)):Register {
    try {
        if(string !== null) {
            const buffer:any = JSON.parse(string);
            const list = Object.keys(buffer);
            for(const key of SystemRegisterKeys) {
                if(buffer[key] === undefined)
                    throw new Error("Register missing system value: " + key);

                if(buffer[key].type !== SystemRegister[key])
                    throw new Error(`Register system type mismatch: Expected ${SystemRegister[key]} but got ${buffer[key].type}`);

                buffer[key] = fromRegisterStoreValue(buffer[key]);

                const index = list.indexOf(key);
                list.splice(index, 1);
            }

            for(let name of list){
                if(!isResterTypeKey(buffer[name].type))
                    throw new Error("Register has invalid type: " + name);

                buffer[name].value = fromRegisterStoreValue(buffer[name]);
            }

            return buffer;
        }    
    } catch (e){
        //Console.debug(e);
    }

    const value:Register = <any>{};
    value.Background_Color = Defaults.Background_Color.clone();
    value.Font_Color       = Defaults.Font_Color.clone();
    value.Font_Size        = Defaults.Font_Size.valueOf();
    value.Screen_Height    = Defaults.Screen_Height.valueOf();
    value.Screen_Width     = Defaults.Screen_Width.valueOf();
    setRegister(value);
    return value;
}

/** Set Regsiter to Local Storage
 * 
 * @param {Register} value 
 */
function setRegister(value:Register = RegisterStore) {
    const store:Record<string, RegisterStoreValue> = {};

    for(const name in value) {
        store[name] = toRegisterStoreValue(value[name]);
    }

    localStorage.setItem(REGISTER_KEY, JSON.stringify(store));
}

const listeners:Record<string, Function[]> = {};
let RegisterStore:Register = getRegister();
storageListener(REGISTER_KEY, (value)=>{
    RegisterStore = getRegister(value);
}, false);

/** Set Regsiter Value
 * 
 * @param {SystemRegisterKey|RegisterKey} name 
 * @param {RegisterType} value 
 */
function setRegisterValue<K extends SystemRegisterKey, T extends SystemRegisterMap[K]>(name:K, value:RegisterMap[T]):void
function setRegisterValue<K extends RegisterKey, T extends RegisterTypeKey>(name:K, value:RegisterMap[T]):void
function setRegisterValue(name:SystemRegisterKey|RegisterKey,  value:RegisterType):void {
    const type = extractType(value);

    if(isSystemRegisterKey(name) && type !== SystemRegister[name]) {
        throw new TypeError(`System Regester ${name} can only be '${SystemRegister[name]}' but was atempted to be '${type}'!`);
    }

    if(!isResterTypeKey(type))
        throw new TypeError(`${type} is not a Regester Type!`);

    RegisterStore[name] = value;
    setRegister();
}

/** Batch Regiseter Values
 * 
 * @param {Array} list 
 */
function batchRegisterValues(list:{name:SystemRegisterKey|RegisterKey,  value:RegisterType}[]) {
    try {
        for(const {name, value} of list) {
            const type = extractType(value);
    
            if(isSystemRegisterKey(name) && type !== SystemRegister[name]) {
                throw new TypeError(`System Regester ${name} can only be '${SystemRegister[name]}' but was atempted to be '${type}'!`);
            }
    
            if(!isResterTypeKey(type))
                throw new TypeError(`${type} is not a Regester Type!`);
    
            RegisterStore[name] = value;
        }
    } catch (e){
        throw e;
    } finally {
        setRegister()
    }
}

interface RegisterValue {
    readonly type: RegisterTypeKey|"undefined",
    readonly value: RegisterType,
    readonly number: number,
    readonly string: string,
    readonly boolean: boolean,
    readonly color: Color
}

/** Get Register Value
 * 
 * @param {SystemRegisterKey|RegisterKey} name 
 */
function getRegisterValue<K extends SystemRegisterKey>(name:K):RegisterMap[SystemRegisterMap[K]]
function getRegisterValue<K extends RegisterKey>(name:K):RegisterValue
function getRegisterValue(name:SystemRegisterKey|RegisterKey):RegisterType|RegisterValue {
    if(isSystemRegisterKey(name)) {
        return RegisterStore[name];
    }

    const value:RegisterType|undefined = RegisterStore[name];
    if(value === undefined) {
        return {
            value: <any>null,
            get type():RegisterTypeKey|"undefined"{
                return "undefined";
            },
            get number(){
                return 0;
            },
            get string(){
                return "undefined";
            },
            get boolean() {
                return false;
            },
            get color():Color {
                throw new TypeError("'undefined' can't be converted into a color!'");
            }
        } satisfies RegisterValue
    }

    return {
        value: value,
        get type() {
            return extractType(value)
        },
        get number() {
            const n = Number(this.value);
            if(isNaN(n))
                throw new TypeError(`'${value}' can't be converted into a number!`);
            return n;
        },
        get string() {
            return String(this.value);
        },
        get boolean() {
            switch(this.type) {
                case "string":
                    return (this.value as string).toUpperCase() === "TRUE";

                case "number":
                    return (this.value as number) === 1;

                case "bool":
                    return this.value as boolean;

                default:
                    throw new TypeError(`'${value}' can't be converted into a boolean!`);
            }
        },
        get color() {
            if(this.type === "color")
                return this.value as Color;

            try {
                return Color.from(String(this.value))
            } catch (e){
                throw new TypeError(`'${value}' can't be converted into a Color!`)
            }
        }
    } satisfies RegisterValue
}

type ValueListener<T> = (value:T)=>Promise<unknown>|unknown;

function onValueChange<K extends SystemRegisterKey>(name:K, listener:ValueListener<RegisterMap[SystemRegisterMap[K]]>):RegisterMap[SystemRegisterMap[K]]
function onValueChange<K extends RegisterKey>(name:K, listener:ValueListener<RegisterValue>):RegisterValue
function onValueChange(name:SystemRegisterKey|RegisterKey, listener:ValueListener<RegisterType>|ValueListener<RegisterValue>):RegisterType|RegisterValue {
    if(!Array.isArray(listeners[name]))
        listeners[name] = [];

    listeners[name].push(listener);
    return getRegisterValue(name);
}

export default {
    set: setRegisterValue,
    get: getRegisterValue,
    batch: batchRegisterValues,
    on: onValueChange
}