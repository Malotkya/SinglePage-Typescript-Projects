/** /System/Registry/types
 * 
 * These are the default constants that will be used by the app.  If there are
 * settings saved in a cookie those will be used instead.
 * 
 * @author Alex Malotky
 */
import Color from "@/Color";
import { ConfigValue } from "./ConfigFile";

export type RegisterTypeMap = {
    "color": Color,
    "string": string,
    "number": number,
    "bool": boolean
}
export type RegisterTypes = keyof RegisterTypeMap;
export type RegisterValue = RegisterTypeMap[keyof RegisterTypeMap];

export interface ConfigTypeMap extends Record<RegisterTypes, ConfigValue> {
    "color": string,
    "string": string,
    "number": number
    "bool": boolean
}

const RegisterTypeKeys:RegisterTypes[] = [
    "color",
    "number",
    "string",
    "bool"
] as const;

export function toRegesterType<T extends RegisterTypes>(value:any, type:T):RegisterTypeMap[T] {
    switch(type) {
        case "color":
            if(typeof value !== "string")
                throw new TypeError(`Color expected string got ${typeof value}!`);

            return Color.from(value.trim()) as RegisterTypeMap[T];

        case "number":
            return Number(value) as RegisterTypeMap[T];
    
        case "string":
            return String(value) as RegisterTypeMap[T];

        case "bool":
            switch(typeof value) {
                case "string":
                    return (value.toLocaleLowerCase().trim() === "true") as RegisterTypeMap[T];

                case "number":
                    return (value === 1) as RegisterTypeMap[T];

                case "boolean":
                    return value as RegisterTypeMap[T];

                default:
                    return Boolean(value) as RegisterTypeMap[T];
            }

        default:
            throw new TypeError("Invalid Type!");
    }
}

export function fromRegertserType(value:RegisterValue): ConfigValue {
    if(value instanceof Color)
        return value.toString();

    return value;
}

export function isRegisterValue(value:unknown):value is RegisterValue {
    switch(typeof value){
        case "string":
            return true;

        case "number":
            return true;

        case "boolean":
            return true;

        case "object":
            return value instanceof Color;

        default:
            return false;
    }
}

export function isResterType(value:string):value is RegisterTypes {
    return RegisterTypeKeys.includes(value as any);
}