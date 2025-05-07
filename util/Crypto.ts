/** @/Crypto
 * 
 * @author Alex Malotky
 */
import { betterToString } from ".";

/** Hash Value
 * 
 * @param {string} value 
 * @param {Uint8Array} salt 
 * @returns {Promise<Uint8Array>}
 */
async function hashValue(value:string, salt: Uint8Array):Promise<Uint8Array> {
    const key = await crypto.subtle.deriveKey({
            name: "PBKDF2",
            salt: salt,
            iterations: 1000,
            hash: "SHA-256",
        },
        await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(value),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        ),
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    return new Uint8Array(
        await crypto.subtle.exportKey("raw", key)
    );
}

/** Array to Hex String
 * 
 * @param {Uint8Array} value 
 * @returns {string}
 */
function toHex(value:Uint8Array):string {
    return Array.from(value)
        .map(n=>n.toString(16).padStart(2, "0"))
        .join("");
}

/** Hex String to Array
 * 
 * @param {string} value 
 * @returns {Uint8Array}
 */
function fromHex(value:string):Uint8Array {
    const array:number[] = [];

    let i = 0;
    while(i < value.length) {
        const n = parseInt(value.substring(i, i+=2), 16);
        if(isNaN(n))
            throw new TypeError("Invalid Hex Value!");

        array.push(n);
    }

    return new Uint8Array(array);
}

/** Hash Password
 * 
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password:string):Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashValue(password, salt);

    return toHex(hash)+":"+toHex(salt)
}

/** Verify Password
 * 
 * @param {string} value 
 * @param {string} raw 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(value:string, raw:string):Promise<boolean> {
    const [hash, salt] = value.split(":");

    const key = await hashValue(raw, fromHex(salt));

    return toHex(key) === hash;
}

/** Simple Hash
 * 
 * https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
 */
export function simpleHash(value:any):number {
    const string = betterToString(value);
    let hash = 0;

    for(let i=0; i<string.length; i++){
        hash = (hash << 5) - hash + string.charCodeAt(i);
        hash |= 0;
    }

    return hash;
}

/** Window is Secure
 * 
 * @returns {boolean}
 */
export function isSecure():boolean {
    return crypto.subtle !== undefined;
}