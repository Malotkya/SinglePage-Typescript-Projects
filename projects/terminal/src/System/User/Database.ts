/** /System/User/Database
 * 
 * @author Alex Malotky
 */
import {hashPassword, verifyPassword} from "@/Crypto";
import { Queue, FsDb } from "../Files/Backend";
import { ROOT_USER, ROOT_USER_ID } from ".";
import System, {formatSystemDate, SYSTEM_ID, clear} from "..";
import { assignRoles } from "./Role";
import { startingFiles } from "../Initalize";

const SEPERATOR = "    ";

const USER_FILE = "/etc/passwd";
const HASH_FILE = "/etc/shadow";
const WHO_ID    = "/var/who";
const USER_SYSTEM_ID = "100";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

startingFiles(USER_SYSTEM_ID, {
    "var": {
        "who": ""
    }
})

//User Database Data
export interface UserData {
    id:string
    username: string
    role: number
    home:string
}

export async function init(rootPassword:string|undefined):Promise<void> {
    const ref = Queue("readwrite");

    const test = await FsDb.getInfo(USER_FILE, (await ref.open()) as any);
    ref.close();
    if(test)
        return;

    if(rootPassword){
        await FsDb.createFile(USER_FILE, {recursive: true, soft: true, user: ROOT_USER_ID},  await ref.open(),
            encoder.encode(
                ROOT_USER_ID+SEPERATOR+assignRoles("None")+SEPERATOR+"root"+"\n"
                +SYSTEM_ID+SEPERATOR+assignRoles("None")+SEPERATOR+"System"+"\n"
                +USER_SYSTEM_ID+SEPERATOR+assignRoles("None")+SEPERATOR+"User-System"+"\n"
            )
        );
        ref.close();

        const hash = await hashPassword(rootPassword);
        await FsDb.createFile(HASH_FILE, {recursive: true, user: ROOT_USER_ID}, await ref.open(),
            encoder.encode(ROOT_USER_ID+SEPERATOR+hash)
        );
        ref.close();

    } else {
        await FsDb.createFile(USER_FILE, {recursive: true, soft: true, user: ROOT_USER_ID},  await ref.open(),
            encoder.encode(
                SYSTEM_ID+SEPERATOR+assignRoles("None")+SEPERATOR+"System"+"\n"
                +USER_SYSTEM_ID+SEPERATOR+assignRoles("None")+SEPERATOR+"User-System"+"\n"
            )
        );
        ref.close();
    }
}

export async function start():Promise<UserData|null> {
    const ref = Queue("readwrite");
    const startTx = await ref.open();
    const userData = decoder.decode(await FsDb.readFile(USER_FILE, USER_SYSTEM_ID, startTx as any));
    const test = await FsDb.getInfo(HASH_FILE, startTx as any);
    ref.close();

    if(test) 
        return null;

    clear();
    System.println("Welcome to the terminal emulator.  Please create an account.");
    let username = await System.prompt("Username: ");
    while(username !== "" && _find(2, username, userData)) {
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
    const id = crypto.randomUUID();
    const role = assignRoles(["Admin", "User"])

    await FsDb.writeToFile(USER_FILE, {user: ROOT_USER_ID, type: "Append"},
        encoder.encode(ROOT_USER_ID+SEPERATOR+assignRoles("None")+SEPERATOR+"root"+"\n"
        +id+SEPERATOR+role+SEPERATOR+username), await ref.open()
    );
    ref.close();

    const hash1 = await hashPassword(password1);
    const hash2 = await hashPassword(password2);
    const tx = await ref.open();
    await FsDb.createFile(HASH_FILE, {recursive: true, user: ROOT_USER_ID}, tx,
        encoder.encode(ROOT_USER_ID+SEPERATOR+hash1+"\n"
        +id+SEPERATOR+hash2)
    )
    const home = "/home/"+username;
    await FsDb.createDirectory(home, {recursive: true, soft: true, user: id}, tx);

    await FsDb.writeToFile(WHO_ID, {user: ROOT_USER_ID, type: "Rewrite"}, encoder.encode(id), tx);
    ref.close();

    return {
        id, username, role, home
    }
}

export async function requestSystemUserId(name:string):Promise<string> {
    if(name === "root" || name === "UserSystem")
        throw new Error("Name already Taken!");

    const ref = Queue("readwrite");
    const tx = await ref.open();
    const userData = decoder.decode(await FsDb.readFile(USER_FILE, USER_SYSTEM_ID, tx as any));
    const user = _find(2, name, userData);
    if(user) {
        ref.close();
        return user.id;
    }

    let id:number = 0;
    while(_find(0, String(id), userData) !== null)
        id = Math.ceil(Math.random() * 1000);

    FsDb.writeToFile(USER_FILE, {user: USER_SYSTEM_ID, type: "Append"},encoder.encode(
        "\n"+id+SEPERATOR+assignRoles("None")+SEPERATOR+name
    ), tx);

    return String(id);
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

    const ref = Queue("readwrite");
    const tx = await ref.open();
    await FsDb.writeToFile(USER_FILE, {type: "Append", user: USER_SYSTEM_ID}, encoder.encode("\n"+id+SEPERATOR+role+SEPERATOR+username), tx);
    await FsDb.writeToFile(HASH_FILE, {type: "Append", user: USER_SYSTEM_ID}, encoder.encode("\n"+id+SEPERATOR+hash), tx);
    await FsDb.createDirectory("/home/"+username, {recursive: true, soft: true, user: id}, tx);
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
                home: data[0] === ROOT_USER_ID? "/root": '/home/'+data[2]
            }
        }
    }

    return null;
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
    const ref = Queue("readwrite");
    const tx = await ref.open();

    const buffer = decoder.decode(await FsDb.readFile(USER_FILE, USER_SYSTEM_ID, tx as any)).split("\n");
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
        await FsDb.writeToFile(USER_FILE, {user:USER_SYSTEM_ID, type: "Rewrite"}, encoder.encode(buffer.join("\n")), tx);

    if(typeof password === "string") {
        const buffer = decoder.decode(await FsDb.readFile(HASH_FILE, USER_SYSTEM_ID, tx as any)).split("\n");
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

        await FsDb.writeToFile(HASH_FILE, {user:USER_SYSTEM_ID, type: "Rewrite"}, encoder.encode(buffer.join("\n")), tx);
    }

    ref.close();
}

/** Delete User
 * 
 * @param {string} username
 */
export async function deleteUser(username:string):Promise<void> {

    const ref = Queue("readwrite");
    const tx = await ref.open();

    const users = decoder.decode(await FsDb.readFile(USER_FILE, USER_SYSTEM_ID, tx as any)).split("\n");
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
        await FsDb.writeToFile(USER_FILE, {user:USER_SYSTEM_ID, type: "Rewrite"}, encoder.encode(users.join("\n")), tx);
        const hashs = decoder.decode(await FsDb.readFile(HASH_FILE, USER_SYSTEM_ID, tx as any)).split("\n");
        for(let i=0; i<hashs.length; ++i){
            const data = users[i].split(/\s+/);
            if(data[0] === id) {
                hashs.splice(i, 1);
                await FsDb.writeToFile(HASH_FILE, {user:USER_SYSTEM_ID, type: "Rewrite"}, encoder.encode(hashs.join("\n")), tx);
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
    const ref = Queue("readonly");
    const tx = await ref.open();

    const buffer = decoder.decode(await FsDb.readFile(USER_FILE, USER_SYSTEM_ID, tx));
    const user = _find(2, username, buffer);
    if(user === null){
        ref.close();
        return null;
    }

    const hashes = decoder.decode(await FsDb.readFile(HASH_FILE, USER_SYSTEM_ID, tx));
    ref.close();
    for(const line of hashes.split("\n")){
        const data = line.split(/\s+/);
        if(user.id === data[0] && await verifyPassword(data[1], password))
            return user;
    }

    return null;
}

export async function login(username:string, password:string):Promise<UserData|null> {
    const user = await validateUser(username, password);

    if(user === null || user === undefined)
        return null;

    const ref = Queue("readwrite");
    const tx = await ref.open();
    await FsDb.writeToFile(WHO_ID, {user:USER_SYSTEM_ID, type: "Rewrite"}, encoder.encode(user.id), tx);
    ref.close();
    return user;
}

export async function logout():Promise<void> {
    const ref = Queue("readwrite");
    const tx = await ref.open();
    await FsDb.writeToFile(WHO_ID, {user:USER_SYSTEM_ID, type: "Rewrite"}, encoder.encode(), tx);
    ref.close();
}

export async function getUserById(id:string|null = null):Promise<UserData|null> {

    const ref = Queue("readonly");
    const tx = await ref.open();
    if(id === null) {
        id = decoder.decode(await FsDb.readFile(WHO_ID, USER_SYSTEM_ID, tx));
    }
    

    if(id === "") {
        ref.close();;
        return null;
    }
    
    const buffer = decoder.decode(await FsDb.readFile(USER_FILE, USER_SYSTEM_ID, tx));
    ref.close();
    
    return _find(0, id, buffer);
}

export interface LogOptions {
    type?:"Login"|"Logout"
    status?:"Failed"|"Succeeded"
    username?:string
    before?:Date
    after?:Date
}

export type Log = {
    date: Date
    type: "Login"|"Logout"
    status: "Failed"|"Succeeded"
    username: string
}

export async function readLogs(opts:LogOptions = {}):Promise<Log[]> {
    const ref = Queue("readonly");
    let lines:Log[] = decoder.decode(await FsDb.readFile("/var/log/user", USER_SYSTEM_ID, await ref.open())).split("\n").map(s=>{
        if (s){
            const [start, end] = s.split("-");
            let index = start.lastIndexOf(" ");
            const date = new Date(start.substring(0, index).trim());
            const type = start.substring(index+1).trim() as "Login"|"Logout";

            index = end.indexOf(":");
            const status = end.substring(0, index) as "Failed"|"Succeeded";
            const username = end.substring(index+1).trim();

            return {
                date, type, status, username
            };
        }
        
        return null;
    }).filter(l=>l !== null);
    ref.close();

    const {type, status, username, before, after} = opts;
    if(type)
        lines = lines.filter(log=>log.type === type);

    if(status)
        lines = lines.filter(log=>log.status === status);

    if(username)
        lines = lines.filter(log=>log.username === username);

    if(before)
        lines = lines.filter(log=>log.date.getTime() < before.getTime());

    if(after)
        lines = lines.filter(log=>log.date.getTime() > after.getTime());

    return lines;
}

export async function logUser(type:"Login"|"Logout", status:"Failed"|"Succeeded", username:string):Promise<void> {
    const string = `${formatSystemDate(new Date(), "DateTime")} ${type}-${status}: ${username}\n`;
    const ref = Queue("readwrite");
    await FsDb.writeToFile("/var/log/user", {user:USER_SYSTEM_ID, type: "Append", force: true}, encoder.encode(string), await ref.open());
    ref.close();
}