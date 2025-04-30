/** /System/User/Role
 * 
 * @author Alex Malotky
 */

//Possible Roles
const Roles = [
    "None",
    "Admin",
    "User"
] as const;

//User Role
type Role = typeof Roles[number];
export default Role;

/** Value Of Role
 * 
 * @param {Role} role 
 * @returns {number}
 */
function valueOf(role:Role):number {
    const i = Roles.indexOf(role) - 1;
    if(i < 0)
        return 0;

    return 1 << i;
}

/** Assign Roles
 * 
 * @param {Role[]|Role} roles
 * @returns {number}
 */
export function assignRoles(roles:Role[]|Role):number {
    
    if(Array.isArray(roles)) {
        let value = 0;
        for(const role in new Set(roles))
            value += valueOf(role as Role);
        return value;
    }

    return valueOf(roles);
}

/** Has Role
 * 
 * @param {number} value 
 * @param {Role} role 
 * @returns {boolean}
 */
export function hasRole(value:number|undefined, role:Role):boolean {
    if(value === undefined)
        return false;
    
    const mask = valueOf(role);
    return (value & mask) === mask;
}