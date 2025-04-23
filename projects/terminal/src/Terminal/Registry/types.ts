/** /Terminal/Register/types
 * 
 * These are the default constants that will be used by the app.  If there are
 * settings saved in a cookie those will be used instead.
 * 
 * @author Alex Malotky
 */
import Color from "@/Color";

const RegisterTypeKeys = [
    "color",
    "number",
    "string",
    "bool"
] as const;
export type RegisterTypeKey = typeof RegisterTypeKeys[number];

export type RegisterMap = {
    "color": Color,
    "number": number,
    "string": string,
    "bool": boolean
}
export type RegisterType = RegisterMap[keyof RegisterMap];

export type RegisterKey = string;

export const SystemRegister = {
    "Background_Color": "color",
    "Font_Color": "color",
    "Font_Size": "number",
    "Screen_Width": "number",
    "Screen_Height": "number",
} as const;
export const SystemRegisterKeys = Object.keys(SystemRegister) as SystemRegisterKey[];

export type SystemRegisterMap = typeof SystemRegister;
export type SystemRegisterKey = keyof SystemRegisterMap;

export type SystemRegisterTypeMap = {
    [K in SystemRegisterKey]: RegisterMap[SystemRegisterMap[K]]
}

export function extractType<K extends RegisterTypeKey>(value:RegisterMap[K]):K {
    if(value instanceof Color)
        return "color" as K;

    return typeof value as K;
}

export function isSystemRegisterKey(value:string):value is SystemRegisterKey {
    return SystemRegisterKeys.includes(value as any);
}

export function isResterTypeKey(value:string):value is RegisterTypeKey {
    return RegisterTypeKeys.includes(value as any);
}