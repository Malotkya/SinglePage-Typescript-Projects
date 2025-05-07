/** /System/User
 * 
 * @author Alex Malotky
 */
import * as db from "./Database";
import Role, {assignRoles, hasRole} from "./Role";
import { isSecure } from "@/Crypto";
import System from "..";
import fs from "../Files";

export type UserId = string|null;

//User Constants
export const NO_USER = null;
export const ROOT_USER_ID = "0";
export const ROOT_USER = "root";

/** Init User System
 * 
 */
export async function init():Promise<void> {
    if(!isSecure()){
        System.println("Warining! The Crypto library is unavailable!\nCan only be logged in as a guest!");
        return;
    }

    const start = await db.init();
    if(start){
        user = start;
        await fs.cd(user.home);
    } else {
        user = await db.getUserById();
        if(user === NO_USER){
        
            let username = await System.prompt("Username: ");
            let password = await System.prompt("Password: ", true);
    
            while((await login(username, password)) === false){
                System.println("Incorect username or password!\n");
    
                username = await System.prompt("Username: ");
                password = await System.prompt("Password: ", true);
            }

            
        } else {
            db.logUser("Login", "Succeeded", user.username);
            await fs.cd(user.home);
        }
    }
}

/** Get User By Id
 * 
 * @param {string} id 
 * @returns {UserData}
 */
export async function getUserById(id:string|null):Promise<db.UserData|null> {
    try {
        return await db.getUserById(id);
    } catch (e){
        console.warn(e);
        return null;
    }
}

/** Add User
 * 
 * @param {string} username 
 * @param {string} password 
 * @param {Role|Role[]} role 
 */
export async function addUser(username:string, password:string, role:Role[]|Role = "User"):Promise<void> {
    if(!isSecure()){
        System.println("Unable to add user when Crypto library is unavailable!");
        return;
    }

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
    if(!isSecure()){
        System.println("Unable to delete user when Crypto library is unavailable!");
        return;
    }

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
    if(!isSecure()){
        System.println("Unable to update user when Crypto library is unavailable!");
        return;
    }

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
    if(!isSecure()){
        System.println("Unable to login when Crypto library is unavailable!");
        return false;
    }

    if(user !== NO_USER || await db.getUserById()) {
        await db.logUser("Login", "Failed", username);
        throw new Error("User is already logged in!");
    }

    user = await db.login(username, password);
    if(user){
        await db.logUser("Login", "Succeeded", username);
        await fs.cd(user.home);
    } else {
        await db.logUser("Login", "Failed", username);
    }
    return user !== NO_USER;
}

/** Logout User
 * 
 */
export async function logout() {
    if(!isSecure()){
        System.println("Unable to logout when Crypto library is unavailable!");
        return;
    }

    await db.logout();
    await db.logUser("Logout", "Succeeded", user?.username || "guest");
    user = null;
    fs.cd("/home/guest");
}

//Current User Cached
let user:db.UserData|null = NO_USER;
/** Get Current User
 * 
 * @returns {Promise<UserData|null>}
 */
async function currentUser():Promise<db.UserData|null> {
    if(user === null){
        try {
            user = await db.getUserById();
        } catch (e){
            console.warn(e);
        }
    }

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
        return user?.id || null;
    },

    /**
     * 
     */
    async home():Promise<string> {
        const c = await currentUser();
        if(c === null)
            return "/home/guest";

        return c.home;
    },

    /** Is Root
     * 
     * @param {string} password
     * @returns {Promise<boolean>}
     */
    async isRoot(password?:string):Promise<boolean> {
        if(!isSecure())
            return false;
        
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