/** /System/Kernel/Script
 *  
 * @author Alex Malotky
 */

/** Function To String
 * 
 * @param {Function} fun 
 * @returns {string}
 */
export function functionToString(fun:Function):string {
    const value = (""+fun).replaceAll(/\s+/g, " ");

    let match = value.match(/^.*?{(.*)}.*?$/);
    if(match)
        return match[1];

    match = value.match(/^.*?=>(.*?)$/);
    if(match)
        return match[1];

    return value;
}