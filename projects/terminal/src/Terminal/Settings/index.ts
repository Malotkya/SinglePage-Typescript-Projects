/** /Terminal/Settings
 * 
 * @author Alex Malotky
 */
import {storageListener} from "@/Storage";
import Default from "./Defaults";
import Color from "@/Color";
import {NumberOr, ColorOr} from "@";
import SettingsApp from "./App";

export {SettingsApp};

export type SettingsMap = typeof Default;
export type SettingsName   = keyof SettingsMap;
export type SettingsValue = SettingsMap[keyof SettingsMap];
type SettingHandler = (name:SettingsName, value:SettingsValue)=>void|Promise<void>;

//Local Storage Key
const key = (index:string) => "Settings:"+index;

const listeners:SettingHandler[] = [];
/** Update Event Listener
 * 
 * @param {SettingHandler} callback 
 */
export function updateEvent(callback:SettingHandler) {
    if(!listeners.includes(callback))
        listeners.push(callback);
}

/** Save Value
 * 
 * @param {string} name 
 * @param {any} value 
 */
export function saveValue<N extends SettingsName>(name:N, value:SettingsMap[N]):void {
    localStorage.setItem(key(name), value.toString());
}

/** Emit Update Event
 * 
 * @param {string} name 
 * @param {any} value 
 */
async function emitEvent<K extends SettingsName>(name:K, value:SettingsMap[K]){
    for(const fun of listeners)
        await fun(name, value);
}

/** Normalize Value
 * 
 * @param {string} value 
 * @param {any} defaultValue 
 * @returns {any} 
 */
function normalizeValue<T extends SettingsValue>(value:string, defaultValue:T):T {
    switch (typeof defaultValue) {
        case "number":
            return <any>NumberOr(value, defaultValue);

        case "string":
            return <any>value;

        case "object":
            if(defaultValue instanceof Color)
                return <any>ColorOr(value, defaultValue);

        default:
            throw new TypeError(`Unkown setting type for: ${defaultValue}!`);
    }
}

// Initalize Settings after a timeout.
window.setTimeout(()=>{
    for(const name in Default) {
        storageListener(key(name), (value)=>{
            emitEvent(name as SettingsName, normalizeValue(value, Default[name as SettingsName]))
        });
    }
}, 100);

export default {
    get width(){
        return NumberOr(localStorage.getItem(key("width")), Default.width);
    },

    get height(){
        return NumberOr(localStorage.getItem(key("height")), Default.height);
    },

    get fontSize(){
        return NumberOr(localStorage.getItem(key("font-size")), Default["font-size"]);
    },

    get fontColor(){
        return ColorOr(localStorage.getItem(key("font-color")), Default["font-color"]);
    },

    get backgroundColor(){
        return ColorOr(localStorage.getItem(key("background-color")), Default["background-color"]);
    },
}