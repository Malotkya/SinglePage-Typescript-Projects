/** /System/Kernel/Mode
 * 
 * @author Alex Malotky
 */
import { ROOT_USER_ID, UserId } from "./User";

export const DEFAULT_DRIECTORY_MODE = 775;
export const DEFAULT_FILE_MODE = 664;
export const DEFAULT_ROOT_MODE = 755;

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
    value = Math.floor(value / group) % 10;
    return (value & operation) === operation
}

/** Formate Mode
 * 
 * @param {number} value 
 * @returns {number}
 */
function _format(value:number):number {
    value = value % 10;
    if(value < 0 || isNaN(value))
        return 0;
    if(value > 7)
        return 7
    return value;
}

//Valid Operations
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
export function validate(value:number, owner:UserId, user:UserId, operation:Operations):boolean {
    if(user === ROOT_USER_ID)
        return true;
    
    const group:GroupValue = user === owner
        ? 100
        : user === null
            ? 1
            : 10;

    const o:OperationValue|-1 = ValidOperations.indexOf(operation) as any;
    if(o === -1)
        throw new TypeError(`Invalid Operation: ${operation}!`);

    return _validate(value, group, o);
}

/** Format Mode
 * 
 * @param {number} value 
 * @returns {number}
 */
export function formatMode(value:number):number {
    const user  = _format(Math.floor(value / 100));
    const group = _format(Math.floor(value / 10));
    const other = _format(Math.floor(value));

    return (user * 100) + (group * 10) + other;
}