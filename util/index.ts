/** @
 * 
 * Util Folder for Simple Typescirpt Apps
 * 
 * @author Alex Malotky
 */
import Color from "./Color";

/** Sleep
 * 
 * Await sleep n microsceconds
 * 
 * @param {number} n
 * @returns {Prmoise<void>}
 */
export function sleep(n:number = 1):Promise<void> {
    return new Promise((res)=>window.setTimeout(res, n));
}

/** Get Number Or Default
 * 
 * @param {unknown} value 
 * @param {number} d 
 * @returns {number}
 */
export function NumberOr(value:unknown, d:number):number {
    switch(value){
        case "":
        case undefined:
        case null:
            return d;

        default:
            const n = Number(value);

            if(isNaN(n))
                return d;

            return n;
    }
}

/** Better To String
 * 
 * @param {any} value 
 * @returns {string}
 */
export function betterToString(value:any):string {
    const type = typeof value;
    if(type === "string")
        return value;

    if(typeof value.toString === "function")
        return value.toString();

    if(type === "object")
        return JSON.stringify(value);

    return String(value);
}

export function regexSplit(value:string, seperator:RegExp):string[]{
    const output:string[] = [];
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
                    if(char.match(seperator) && current) {
                        output.push(current);
                        current = "";
                    } else {
                        current += char
                    }
                } 
        }
    } //End For

    if(current){
        output.push(current);
    }

    return output;
}

/** Custom Float Converter
 * 
 * Used to convert decimal values that might be stored in a BufferArray
 * 
 * @param {boolean} sBit - Is the float signed.
 * @param {number} eBits - Number of bits reserved for the exponent.
 * @param {number} mBits - Number of bits reserved for the Mantissa.
 * @param {number} expectedSize - Expected Number of bits (optional check)
 * @returns {[toFloat:Function, toBits:Function]}
 */
export function customFloat(sBit:boolean, eBits:number, mBits:number, expectedSize?:number):[toFloat:(bits:number)=>number, toBits:(float:number)=>number] {
    if(eBits < 0)
        throw new TypeError("Can't have a negative number of Exponent bits!");

    if(mBits < 0)
        throw new TypeError("Can't have a negative number of Mantissa bits!");

    const size = ((sBit? 1: 0) + eBits + mBits);
    if(size > 32)
        throw new Error("Can't exceed 32 bits!");

    if(expectedSize && expectedSize !== size)
        console.warn("The number of bits calculated does not match the expected size!");

    const MantissaModifier = 1 << mBits;
    const MantissaBits = MantissaModifier - 1;
    const SignedBit = sBit? (1 << (size-1)): 0;

    if(eBits === 0){
        return [
            function toFloat(bits:number):number {
                const M = bits & MantissaBits;
                const S = sBit? (bits & SignedBit) === SignedBit: false;

                const base = M / MantissaModifier;
                return (S?-1:1) * base;
            },
            function toBits(float:number):number {
                const S = float < 0;
                if(S && !sBit)
                    throw new Error("Negative number can't be stored in an unsigned float!");

                let bits = S?1:0;
                float = Math.abs(float);
                
                const M = Math.floor(float * MantissaModifier);
                bits = (bits << mBits) + M;

                return bits;
            }
        ]
    }

    const MaxExponent = (1 << eBits) - 1;
    const ExponentBits = ((1 << (mBits+eBits))-1)-MantissaBits;
    

    return [
        function toFloat(bits:number):number {
            const M = bits & MantissaBits;
            const E = ((bits & ExponentBits) >> mBits)-1;
            const S = sBit? (bits & SignedBit) === SignedBit: false;
            
            const base = 1 + (M / MantissaModifier);


            return (base * (1 << E)) * (S?-1:1);
        },
        function toBits(float:number):number {
            const S = float < 0;
            if(S && !sBit)
                throw new Error("Negative number can't be stored in an unsigned float!");

            let bits = S?1:0;

            float = Math.abs(float);
            const E = float< 1 ? -1: Math.ceil(Math.log2(float));
            if(E >= MaxExponent)
                throw new Error(`Out of Range!`);

            bits = (bits << eBits) + (E+1);

            const floor = E < 0? 0: 1 << E;
            const ceil  = 1 << (E+1);
            const base = (float - floor) / (ceil - floor);
            const M = Math.floor( base * MantissaModifier);

            bits = (bits << mBits) + M;

            return bits;
        }
    ]
}