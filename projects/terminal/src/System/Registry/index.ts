/** /System/Registry
 * 
 * These are the default constants that will be used by the app.  If there are
 * settings saved in a cookie those will be used instead.
 * 
 * @author Alex Malotky
 */
import OpenConfigFile, {GlobalConfig, ConfigFile, Section, ConfigSection} from "./ConfigFile";
import {RegisterTypes, RegisterTypeMap, toRegesterType, ConfigTypeMap, fromRegertserType, isRegisterValue} from "./types";

type ObjectFormat  = Record<string, RegisterTypes>;
export type RegisterFormat = Record<string, RegisterTypes|ObjectFormat>;

type TypeFormat<T extends RegisterTypes> = ConfigTypeMap[T];
type SectionFormat<OF extends ObjectFormat, K extends (keyof OF)&string>
    = Record<K, TypeFormat<OF[K]>>&ConfigSection;
type GlobalFormat<RF extends RegisterFormat, K extends(keyof RF)&string>
    = Record<K,
        RF[K] extends ObjectFormat
            ? SectionFormat<RF[K], (keyof RF[K])&string>
            : RF[K] extends RegisterTypes
                ? TypeFormat<RF[K]>
                : never
    >&GlobalConfig;

interface RegisterObject<OF extends ObjectFormat> {
    get<K extends keyof OF>(key:K):RegisterTypeMap[OF[K]]
    set<K extends keyof OF>(key:K, value:RegisterTypeMap[OF[K]]):void
}

export class Register<F extends RegisterFormat> {
    private _f:F;
    private _c: ConfigFile<GlobalFormat<F, (keyof F)&string>>;
    constructor(format:F, config:ConfigFile<GlobalFormat<F, (keyof F)&string>>){
        this._f = format;
        this._c = config;
    }

    get<K extends (keyof F)&string>(key:K):
            F[K] extends ObjectFormat? RegisterObject<F[K]>: F[K] extends RegisterTypes? RegisterTypeMap[F[K]]: never {
        if(typeof this._f[key] === "object") { 
            const get = <k extends (keyof F[K])&string>(k:k) => {
                return toRegesterType((this._c.get(key) as Section<any, any>).get(k), this._f[key][k] as RegisterTypes);
            }
            const set = <k extends (keyof F[K])&string, t extends RegisterTypeMap[(F[K]&ObjectFormat)[k]]&RegisterTypes>(k:k, value:t) => {
                if(this._c.type === "ReadOnly")
                    throw new Error("Register is readonly!");

                (this._c.get(key) as Section<K, any>).set(k, fromRegertserType(value));
            }
            return {
                get, set
            } as F[K] extends ObjectFormat? RegisterObject<F[K]>: F[K] extends RegisterTypes? RegisterTypeMap[F[K]]: never;
        } 
        return toRegesterType(this._c.get(key), this._f[key] as RegisterTypes) as  F[K] extends ObjectFormat? RegisterObject<F[K]>: F[K] extends RegisterTypes? RegisterTypeMap[F[K]]: never
    }

    set<K extends (keyof F)&string, T extends RegisterTypeMap[F[K]&RegisterTypes]>(key:K, type:T) {
        if(!isRegisterValue(type))
            throw new Error("Cannot set value as Register Object!");

        if(this._c.type === "ReadOnly")
            throw new Error("Register is readonly!");

        this._c.set(key, fromRegertserType(type) as any);
    }
}

export default async function OpenRegister<F extends RegisterFormat>(value:string, format:F, mode:"ReadOnly"|"ReadWrite" = "ReadOnly") {
    return new Register(format, await OpenConfigFile<GlobalFormat<F, (keyof F)&string>>(`/etc/${value}.cf`, mode));
}

export const SystemRegistries = {
    terminal: {
        height: "number",
        width: "number",
        background: {
            color: "color"
        },
        font: {
            color: "color",
            size: "number"
        }
    }
} as const;

export type TerminalRegister = Register<typeof SystemRegistries["terminal"]>;