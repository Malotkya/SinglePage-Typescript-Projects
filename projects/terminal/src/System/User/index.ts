/** /System/User
 * 
 * @author Alex Malotky
 */
import * as db from "./Database";
import { addToCleanup } from "@/CleanUp";
import Role, {assignRoles, hasRole} from "./Role";
import System from "..";
import Database from "../Database";

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
export async function init(username:string, password:string):Promise<void> {
    const ref = Database("User", "readwrite");
    const tx = await ref.open();
    if(await db.hasUser(ROOT_USER, tx as any))
        throw new Error("Root User already exists!");

    await db.addUser(ROOT_USER, password, assignRoles("None"), tx, ROOT_USER_ID);
    current_id = await db.addUser(username, password, assignRoles(["Admin", "User"]), tx);
    ref.close();
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

    const ref = Database("User", "readwrite");
    const tx = await ref.open();

    if(await db.hasUser(username, tx as any))
        throw new Error("Username already exists!");

    await db.addUser(username, password, assignRoles(role), tx);
    ref.close();
}

/** Delete User
 * 
 * @param {string} username 
 */
export async function deleteUser(username:string):Promise<void> {
    if((username !== await User.username()) && !(await User.isRole("Admin"))){
        await User.assertRoot();
    }
    const ref = Database("User", "readwrite");
    await db.deleteUser(username, await ref.open());
    ref.close();
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

    const ref = Database("User", "readwrite");
    await db.updateUser(username, {
        password: opts.password,
        role: opts.role? assignRoles(opts.role): undefined
    }, await ref.open());
    ref.close();
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

    const ref = Database("User", "readonly");
    const tx = await ref.open();
    current_id = await db.validateUser(username, password, tx);
    user = await db.getUser(current_id, tx);
    ref.close();

    return current_id !== NO_USER;
}

/** Get User By Id
 * 
 * @param {UserId} id 
 * @returns {Promise<UserData|null>}
 */
export async function getUserById(id:UserId):Promise<db.UserData|null> {
    const ref = Database("User", "readonly");
    const record = await db.getUser(id, await ref.open());
    ref.close();
    return record;
}

/** Logout User
 * 
 */
export function logout() {
    current_id = NO_USER;
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

    const ref = Database("User", "readonly");
    user = await db.getUser(current_id, await ref.open());
    ref.close();

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
            password = await System.prompt("[sudo] Password: ");

        const ref = Database("User", "readonly");
        const result = await db.validateUser(ROOT_USER, password, await ref.open());
        ref.close();

        return result !== null;
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