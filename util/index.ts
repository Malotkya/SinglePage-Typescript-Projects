/** @
 * 
 * Util Folder for Simple Typescirpt Apps
 * 
 * @author Alex Malotky
 */

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
    const n = Number(value);

    if(isNaN(n))
        return d;

    return n;
}