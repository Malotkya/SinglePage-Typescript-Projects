/** /System/User
 * 
 * @author Alex Malotky
 */
import * as db from "./Kernel/User";
import Role, {assignRoles, hasRole} from "./Kernel/Role";
import { isSecure } from "@/Crypto";
import System, {clear, formatSystemDate} from ".";
import { startingFiles } from "./Kernel/Initalize";

export const RequestUserSystemId = db.requestSystemUserId;
export const logout = db.logout;
export default db.default;
export type UserId = db.UserId;

startingFiles(null, {
    "home": {
        "guest": {}
    }
});

/** Start User System
 * 
 */
export async function start():Promise<void> {
    let ready = await db.softInit();
    if(typeof ready === "boolean"){
        //Need to login?
        if(!ready){
            System.println("Welcome to the terminal emulator.  Please login.");
            let username = await System.prompt("Username: ");
            let password = await System.prompt("Password: ", true);

            while((await db.login(username, password))  === false){
                System.println("Invalid username or password!");
                username = await System.prompt("Username: ");
                password = await System.prompt("Password: ", true);
            }
        }
        
    } else {
        //Create an account!
        clear();
        System.println("Welcome to the terminal emulator.  Please create an account.");
        while(!ready) {
            let username = await System.prompt("Username: ");
            while(username !== "") {
                System.println("Invalid username!");
                username = await System.prompt("Username: ");
            }

            let password1 = await System.prompt("Password: ", true);
            let password2 = await System.prompt("Confirm Password: ", true);
            while(password1 !== password2) {
                System.println("Passwords do not match!");
                password1 = await System.prompt("Password: ", true);
                password2 = await System.prompt("Confirm Password: ", true);
            }

            try {
                ready = await db.softInit({
                    username: username,
                    password: password1
                });

                if(ready === false || ready === undefined)
                    throw "An unkown error occrured creating your account!";
            } catch(e:any){
                console.error(e);
                System.println(`Error: ${e.message || String(e)}`);
                ready = false;
            }
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
        await db.default.assertRoot();
    else
        await db.default.assertRole("Admin");

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

    if((username !== await db.default.username) && !(await db.default.isRole("Admin"))){
        await db.default.assertRoot();
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

    if((username !== await db.default.username) && !(await db.default.isRole("Admin"))) {
        await db.default.assertRoot();
    }

    await db.updateUser(username, {
        password: opts.password,
        role: opts.role? assignRoles(opts.role): undefined
    });
}

/** Welcome the user after logging in
 * 
 * @param {string} username 
 */
async function welcome(username:string){
    clear();
    const value = (await db.readLogs({username})).sort((a, b)=>b.date.getTime()-a.date.getTime());
    if(value.length > 0)
        System.println(`Welcome back ${username}.  Your last login was at: ${formatSystemDate(value[0].date)}.`);
    else
        System.println(`Welcome ${username}. This is your first time logging in!`);
}