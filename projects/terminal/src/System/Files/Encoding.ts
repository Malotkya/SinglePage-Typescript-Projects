/** /System/File/Buffer
 * 
 * @author Alex Malotky
 */

const encoder = new TextEncoder();

/** Encode any value to buffer;
 * 
 * @param {any} value 
 * @returns {string}
 */
export function encodeValue(value:any):Uint8Array {
    if(value instanceof Uint8Array){
        return value;
    } else if(value instanceof Uint16Array){
        return new Uint8Array(value.buffer, value.byteOffset, value.length * 2);
    } else if(value instanceof Uint32Array){
        return new Uint8Array(value.buffer, value.byteOffset, value.length * 4);
    }

    switch(typeof value){
        case "string":
            return encoder.encode(value);

        case "symbol":
        case "number":
        case "bigint":
            return encoder.encode(value.toLocaleString());

        case "boolean":
            return encoder.encode(value? "true": "false");

        case "function":
            return encoder.encode(""+value);

        case "undefined":
            return encoder.encode("undefined");

        
        case "object":
            if(value === null)
                return encoder.encode("null");

            //Let objects convert themselves.
            if(typeof value.toString === "function")
                return encoder.encode(value.toString());

            //Check for Arraylike
            const l = value.length;
            if( typeof l === "number" && l > 0 && Number.isInteger(l) &&
                (l === 0 || (l > 0 && (l - 1) in value)) ) {
                    value = Array.from(value);

            //Convert Map to Record
            } else if(value instanceof Map) {
                let buffer:Record<any, any> = {};
                for(const [k, v] of value.entries())
                    buffer[k] = v;
            
            //Convert FormData to Record
            } else if(value instanceof FormData){
                let buffer:Record<any, any> = {};
                value.forEach((v, k)=>{
                    buffer[k] = v;
                })
            }
                
            return encoder.encode(JSON.stringify(value));
    }
}

export default class Encoding {
    readonly data:Uint8Array;

    constructor(data:any){
        this.data = encodeValue(data);
    }

    get length(){
        return this.data.length;
    }

    Array(l?:8):Uint8Array
    Array(l:16):Uint16Array
    Array(l:32):Uint32Array
    Array(l?:8|16|32):Uint8Array|Uint16Array|Uint32Array{
        return l === 32
            ? new Uint32Array(this.data.buffer, this.data.byteOffset, Math.ceil(Uint8Array.length / 4))
            : l === 16
                ? new Uint16Array(this.data.buffer, this.data.byteOffset, Math.ceil(Uint8Array.length / 2))
                : new Uint16Array(this.data.buffer, this.data.byteOffset, Uint8Array.length)
    }

    Text(encoding?:string):string {
        return new TextDecoder(encoding).decode(this.data);
    }

    Number():number
    Number(bigInt:true):bigint
    Number(bigInt:boolean = false):bigint|number {
        return bigInt
            ? BigInt(this.toString())
            : Number(this.toString());
    }

    Boolean():boolean {
        const value = this.toString().toLowerCase();
        return value === "true" || value === "1";
    }

    Json<T extends any = any>():T {
        return JSON.parse(this.toString());
    }
}