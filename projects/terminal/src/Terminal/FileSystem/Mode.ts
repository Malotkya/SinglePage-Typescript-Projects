/** /Terminal/FileSystem/Mode
 * 
 * @author Alex Malotky
 */

type GroupValue = 1|10|100;
type OperationValue = 0|1|2|3|4|5|6|7;

/** Private Validate Mode
 * 
 * @param {number} value 
 * @param {number} group 
 * @param {number} operation 
 * @returns {boolean}
 */
function _validate(value:number, group:GroupValue, operation:OperationValue):boolean {
    value = Math.floor(value / group);
    return (value & operation) === operation
}

const ValidOperations = [
    "None",
    "ExecuteOnly",
    "WriteOnly",
    "ExecuteWrite",
    "ReadOnly",
    "ExecuteRead",
    "ReadWrite",
    "ExecuteReadWrite"
] as const;

type Operations = typeof ValidOperations[number];

/** Validate Mode
 * 
 * @param {number} value
 * @param {number} owner
 * @param {number} user
 * @param {string} operation 
 * @returns {boolean}
 */
export function validate(value:number, owner:number, user:number, operation:Operations):boolean {
    const group:GroupValue = user > 0
        ? owner === user
            ? 1
            : 10
        : 100;

    const o:OperationValue|-1 = ValidOperations.indexOf(operation) as any;
    if(o === -1)
        throw new TypeError(`Invalid Operation: ${operation}!`);

    return _validate(value, group, o);
}