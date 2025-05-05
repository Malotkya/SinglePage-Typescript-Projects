/** /System/User/Database
 * 
 * @author Alex Malotky
 */
import {hashPassword, verifyPassword} from "@/Crypto";
import { writeToFile, readFile, getInfo, createFile } from "../Files/Database";
import { assertReady } from "../Files";
import { ROOT_USER_ID } from ".";
import System from "..";
import { assignRoles } from "./Role";

const SEPERATOR = "    ";

const USER_FILE = "/etc/passwd";
const HASH_FILE = "/etc/shadow";

//User Database Data
export interface UserData {
    id:string
    username: string
    role: number
    home:string
}

export async function init():Promise<UserData|null> {
    const ref1 = await assertReady("readonly");
    const test = await getInfo(USER_FILE, await ref1.open())
    ref1.close();

    if(test) 
        return null;
    

    System.println("Welcome to the terminal emulator.  Please create an account.");
    const username = await System.prompt("Username: ");
    const password = await System.prompt("Password: ", true);
    const id = crypto.randomUUID();
    const role = assignRoles(["Admin", "User"])

    const ref2 = await assertReady("readwrite");
    const tx = await ref2.open();
    await createFile(USER_FILE, {recursive: true, user: ROOT_USER_ID}, tx,
        ROOT_USER_ID+SEPERATOR+assignRoles("None")+SEPERATOR+"root"+"\n"
        + id+SEPERATOR+role+username
    );
    await createFile(HASH_FILE, {recursive: true, user: ROOT_USER_ID}, tx,
        ROOT_USER_ID+SEPERATOR+await hashPassword(password)+"\n"
        +id+SEPERATOR+await hashPassword(password)
    )
    ref2.close();

    return {
        id, username, role,
        home: "/home/"+username
    }
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
    id = id || crypto.randomUUID();
    const hash = await hashPassword(password); 

    const ref = await assertReady("readwrite");
    const tx = await ref.open();
    await writeToFile(USER_FILE, {type: "Append", user: ROOT_USER_ID}, "\n"+id+SEPERATOR+role+SEPERATOR+username, tx);
    await writeToFile(HASH_FILE, {type: "Append", user: ROOT_USER_ID}, "\n"+id+SEPERATOR+hash, tx);
    ref.close();

    return id;
}

function _find(index:number, value:string, data:string):UserData|null {
    for(const line of data.split("\n")) {
        const data = line.split(/\s+/);
        if(data[index] === value) {
            return {
                id: data[0],
                role: Number(data[1]),
                username: data[2],
                home: '/home/'+data[2]
            }
        }
    }

    return null;
}

/** Get User
 * 
 * @param {string} id 
 * @returns {Promise<UserData|null>}
 */
export async function getUserById(id:string|null):Promise<UserData|null> {
    if(id === null)
        return null;

    const ref = await assertReady("readonly");
    const buffer = await readFile(USER_FILE, ROOT_USER_ID, await ref.open());
    ref.close();
    
    return _find(0, id, buffer);;
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
    const {role, password} = data;
    const ref = await assertReady("readwrite");
    const tx = await ref.open();

    const buffer = (await readFile(USER_FILE, ROOT_USER_ID, tx as any)).split("\n");
    let id:string|null = null;
    for(let i=0; i<buffer.length; ++i){
        const data = buffer[i].split(/\s+/);
        if(data[2] === username){
            if(typeof role === "number") {
                data[1] = role.toString();
                buffer[i] = data.join(SEPERATOR);
            }
            id = data[0];
        }
    }

    if(id === null)
        throw new Error("Unable to find user!");

    if(role)
        await writeToFile(USER_FILE, {user:ROOT_USER_ID, type: "Rewrite"}, buffer.join("\n"), tx);

    if(typeof password === "string") {
        const buffer = (await readFile(HASH_FILE, ROOT_USER_ID, tx as any)).split("\n");
        let update:boolean = false;
        for(let i=0; i<buffer.length; i++){
            const data = buffer[i].split(/\s+/);
            if(data[0] === id) {
                data[1] = await hashPassword(password);
                buffer[i] = data.join(SEPERATOR);
                update = true;
            }
        }

        if(!update)
            buffer.push(id+SEPERATOR+await hashPassword(password));

        await writeToFile(HASH_FILE, {user:ROOT_USER_ID, type: "Rewrite"}, buffer.join("\n"), tx);
    }

    ref.close();
}

/** Delete User
 * 
 * @param {string} username
 */
export async function deleteUser(username:string):Promise<void> {

    const ref = await assertReady("readwrite");
    const tx = await ref.open();

    const users = (await readFile(USER_FILE, ROOT_USER_ID, tx as any)).split("\n");
    let id:string|null = null;
    for(let i=0; i<users.length; ++i){
        const data = users[i].split(/\s+/);
        if(data[2] === username){
            users.splice(i, 1);
            id = data[0];
            break;
        }
    }
    
    if(id !== null){
        await writeToFile(USER_FILE, {user:ROOT_USER_ID, type: "Rewrite"}, users.join("\n"), tx);
        const hashs = (await readFile(HASH_FILE, ROOT_USER_ID, tx as any)).split("\n");
        for(let i=0; i<hashs.length; ++i){
            const data = users[i].split(/\s+/);
            if(data[0] === id) {
                hashs.splice(i, 1);
                await writeToFile(HASH_FILE, {user:ROOT_USER_ID, type: "Rewrite"}, hashs.join("\n"), tx);
                break;
            }
        }
    }

    ref.close();
}

/** Validate User
 * 
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<string|null>}
 */
export async function validateUser(username:string, password:string):Promise<UserData|null> {
    const ref = await assertReady("readonly");
    const tx = await ref.open();

    const buffer = await readFile(USER_FILE, ROOT_USER_ID, tx);
    const user = _find(2, username, buffer);
    if(user === null){
        ref.close();
        return null;
    }

    const hashes = await readFile(HASH_FILE, ROOT_USER_ID, tx);
    ref.close();
    for(const line of hashes.split("\n")){
        const data = line.split(/\s+/);
        if(user.id === data[0] && await verifyPassword(data[1], password))
            return user;
    }

    return null;
}