/** /System/User/Database
 * 
 * @author Alex Malotky
 */
import {hashPassword, verifyPassword} from "@/Crypto";
import Database from "../Database";

//User Database Data
export interface UserData {
    username: string
    password: string
    role: number
}

/** Database Has User
 * 
 * @param {string} username 
 * @returns {Promise<boolean>}
 */
export async function hasUser(username:string):Promise<boolean> {
    const db = await Database<UserData>();
    const user:UserData|undefined = await db.getFromIndex("User", "username", username);

    return user !== undefined
}

/** Add User
 * 
 * @param {string} username 
 * @param {string} password 
 * @param {number} role 
 * @param {id} id 
 * @returns {Promise<string>}
 */
export async function addUser(username:string, password:string, role:number, id?:string):Promise<string> {
    const db = await Database<UserData>();
    id = id || crypto.randomUUID();
    const hash = await hashPassword(password); 

    await db.transaction("User", "readwrite").store.add({
        username: username,
        password: hash,
        role: role
    } satisfies UserData, id);

    return id;
}

/** Get User
 * 
 * @param {string} id 
 * @returns {Promise<UserData|null>}
 */
export async function getUser(id:string|null):Promise<UserData|null> {
    if(id === null)
        return null;
    
    const db = await Database<UserData>();
    
    return (await db.transaction("User", "readonly").store.get(id)) || null;
}

//Update UserData Interface
interface UserUpdate {
    password?: string,
    role?: number
}

/** Update User
 * 
 * @param {string} username 
 * @param {UserUpdate} data 
 */
export async function updateUser(username:string, data:UserUpdate):Promise<void> {
    const db = await Database<UserData>();

    const id = await db.getKeyFromIndex("User", "username", username);
    if(id === undefined)
        throw new Error("Unable to find user!");

    const tx = db.transaction("User", "readwrite");

    const buffer:UserData = (await tx.store.get(id))!; 

    if(typeof data.role === "number") {
        buffer.role = data.role;
    }
    if(typeof data.password === "string") {
        buffer.password = await hashPassword(data.password);
    }

    await tx.store.put(buffer, id);
}

/** Delete User
 * 
 * @param {string} username
 */
export async function deleteUser(username:string):Promise<void> {
    const db = await Database<UserData>();

    const id = await db.getKeyFromIndex("User", "username", username);
    if(id === undefined)
        return;

    await db.transaction("User", "readwrite").store.delete(id);
}

/** Validate User
 * 
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<string|null>}
 */
export async function validateUser(username:string, password:string):Promise<string|null> {
    const db = await Database<UserData>();

    const id = await db.getKeyFromIndex("User", "username", username);
    if(id === undefined)
        return null;

    const tx = db.transaction("User", "readonly");
    const user:UserData = await tx.store.get(id);

    if(await verifyPassword(user.password, password))
        return id as string;

    return null;
}