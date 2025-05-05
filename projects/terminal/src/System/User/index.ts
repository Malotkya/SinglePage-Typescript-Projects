/** /System/User
 * 
 * @author Alex Malotky
 */
import * as db from "./Database";
import { addToCleanup } from "@/CleanUp";
import Role, {assignRoles, hasRole} from "./Role";
import System from "..";

export type UserId = string|null;

//User Constants
export const NO_USER = null;
export const ROOT_USER_ID = "0";
export const ROOT_USER = "root";

//Current User Persistance
const USER_KEY = "Current:User_Id"
let current_id:UserId = localStorage.getItem(USER_KEY) || NO_USER;
addToCleanup(()=>{
    if(current_id)
        localStorage.setItem(USER_KEY, current_id.toString());
});

/** Init User System
 * 
 * @param {string} username 
 * @param {string} password 
 */
export async function init():Promise<void> {
    const start = await db.init();
    if(start){
        current_id = start.id;
        user = start;
    }
}

/** Get User By Id
 * 
 * @param {string} id 
 * @returns {UserData}
 */
export function getUserById(id:string|null):Promise<db.UserData|null> {
    return db.getUserById(id);
}

/** Add User
 * 
 * @param {string} username 
 * @param {string} password 
 * @param {Role|Role[]} role 
 */
export async function addUser(username:string, password:string, role:Role[]|Role = "User"):Promise<void> {
    const roles = assignRoles(role);
    if(hasRole(roles, "Admin"))
        await User.assertRoot();
    else
        await User.assertRole("Admin");

    await db.addUser(username, password, roles);
}

/** Delete User
 * 
 * @param {string} username 
 */
export async function deleteUser(username:string):Promise<void> {
    if((username !== await User.username()) && !(await User.isRole("Admin"))){
        await User.assertRoot();
    }
    await db.deleteUser(username);
}

//Update User Options
export interface UpdateUserOptions {
    password?:string,
    role?:Role|Role[]
}

/** Update User
 * 
 * @param {string} username 
 * @param {UpdateUserOptions} opts 
 */
export async function updateUser(username:string, opts:UpdateUserOptions):Promise<void> {
    if((username !== await User.username()) && !(await User.isRole("Admin"))) {
        await User.assertRoot();
    }

    await db.updateUser(username, {
        password: opts.password,
        role: opts.role? assignRoles(opts.role): undefined
    });
}

/** Login User
 * 
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
export async function login(username:string, password:string):Promise<boolean> {
    if(current_id !== NO_USER)
        throw new Error("User is already logged in!");

    const u = await db.validateUser(username, password);
    if(u) {
        current_id = u.id;
        user = u;
    } else {
        current_id = NO_USER;
        user = null;
    }

    return current_id !== NO_USER;
}

/** Logout User
 * 
 */
export function logout() {
    current_id = NO_USER;
    user = null;
}

//Current User Cached
let user:db.UserData|null = null;
/** Get Current User
 * 
 * @returns {Promise<UserData|null>}
 */
async function currentUser():Promise<db.UserData|null> {
    if(user === null && current_id === NO_USER)
        return null;
    else if(user === null)
        user = await db.getUserById(current_id);

    if(user === null)
        current_id = NO_USER;

    return user;
}

const User = {
    /** Get Username
     * 
     * @returns {string|null}
     */
    async username():Promise<string|null> {
        return (await currentUser())?.username || null;
    },

    /** Get User Id
     * 
     * @returns {Promise<UserId>}
     */
    async id():Promise<UserId> {
        return current_id;
    },

    /** Is Root
     * 
     * @param {string} password
     * @returns {Promise<boolean>}
     */
    async isRoot(password?:string):Promise<boolean> {
        if( (await currentUser())?.username === ROOT_USER)
            return true;

        if(password === undefined)
            password = await System.prompt("[sudo] Password: ", true);

        return null !== await db.validateUser(ROOT_USER, password)
    },

    /** Asert Root
     * 
     * @param {string} password 
     */
    async assertRoot(password?:string):Promise<void> {
        if(!(await this.isRoot(password)))
            throw new Error("Must be root user to continue!");
    },

    /** Is Role
     * 
     * @param {Role} role 
     * @returns {Promise<boolean>}
     */
    async isRole(role:Role):Promise<boolean> {
        const user = await currentUser();
        return user?.username === ROOT_USER || hasRole(user?.role, role);
    },

    /** Assert Role
     * 
     * @param {Role} role 
     */
    async assertRole(role:Role) {
        if( !(await this.isRole(role)) )
            throw new Error(`Must be an ${role} to continue!`);
    }
}
export default User;