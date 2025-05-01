/** /System/User/Database
 * 
 * @author Alex Malotky
 */
import {hashPassword, verifyPassword} from "@/Crypto";
import {DatabaseTransaction} from "../Database";

type UserTransaction<M extends IDBTransactionMode = "readonly"> = DatabaseTransaction<M, "User">;

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
export async function hasUser(username:string, tx:UserTransaction):Promise<boolean> {
    const user:UserData|undefined = await tx.store.index("username").get(username);

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
export async function addUser(username:string, password:string, role:number, tx:UserTransaction<"readwrite">, id?:string):Promise<string> {
    id = id || crypto.randomUUID();
    const hash = await hashPassword(password); 

    await tx.store.add({
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
export async function getUser(id:string|null, tx:UserTransaction):Promise<UserData|null> {
    if(id === null)
        return null;
    
    return (await tx.store.index("username").get(id)) || null;
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
export async function updateUser(username:string, data:UserUpdate, tx:UserTransaction<"readwrite">):Promise<void> {

    const id:string|undefined = await tx.store.index("username").getKey(username);
    if(id === undefined)
        throw new Error("Unable to find user!");

    const buffer:UserData = await tx.store.index("username").get(username)

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
export async function deleteUser(username:string, tx:UserTransaction<"readwrite">):Promise<void> {
    const id:string|undefined = await tx.store.index("username").getKey(username);
    if(id === undefined)
        return;

    await tx.store.delete(id);
}

/** Validate User
 * 
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<string|null>}
 */
export async function validateUser(username:string, password:string, tx:UserTransaction):Promise<string|null> {

    const id:string|undefined = await tx.store.index("username").getKey(username);
    if(id === undefined)
        return null;

    const user:UserData = await tx.store.get(id);

    if(await verifyPassword(user.password, password))
        return id;

    return null;
}