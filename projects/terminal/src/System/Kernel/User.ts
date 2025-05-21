/** /System/Kernel/User
 * 
 * @author Alex Malotky
 */
import {hashPassword, verifyPassword, isSecure} from "@/Crypto";
import Queue from "./Files/TransactionQueue";
import * as FsDb from "./Files";
import {formatSystemDate, SYSTEM_ID} from "..";
import { assignRoles } from "./Role";
import { startingFiles, InitalizeResult, Success, Failure } from "./Initalize";
import Role, {hasRole} from "./Role";

//User Id Type
export type UserId = string|null;

//Public User Constants
export const NO_USER = null;
export const ROOT_USER_ID = "0";
const ROOT_USER = "root"

const SEPERATOR = "    ";

const USER_FILE = "/etc/passwd";
const HASH_FILE = "/etc/shadow";
const WHO_ID    = "/var/who";
const USER_SYSTEM_ID = "100";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

//User Database Data
export interface UserData {
    id:string
    username: string
    role: number
    home:string
}
let user:UserData|null = NO_USER;

export function hardInit():InitalizeResult<undefined> {
    if(!isSecure())
        return Failure(new Error("The Crypto library is unavailable!\nCan only be logged in as a guest!"));

    startingFiles(ROOT_USER_ID, {
        "var": {
            "who": ""
        },
        "etc": {
            "passwd": ROOT_USER_ID+SEPERATOR+assignRoles("None")+SEPERATOR+ROOT_USER+"\n"
                    + SYSTEM_ID+SEPERATOR+assignRoles("None")+SEPERATOR+"System"+"\n",
        }
    });

    return Success();
}

interface InitData {
    username:string,
    password:string
}

export async function softInit(data?:InitData):Promise<boolean|undefined> {
    const ref = Queue("readwrite");
    const test = await FsDb.getInfo(HASH_FILE, (await ref.open()) as any);
    ref.close();

    if(test) {
        const value = await FsDb.readFile(WHO_ID, USER_SYSTEM_ID, (await ref.open()) as any);
        ref.close();
        if(value){
            user = await getUserById(decoder.decode(value));
            return true;
        }

        return false;
    }
        

    if(data === undefined)
        return undefined;

    const {username, password} = data;
    const id = crypto.randomUUID();
    const role = assignRoles(["Admin", "User"]);

    await FsDb.writeToFile(USER_FILE, {user: ROOT_USER_ID, type: "Append"},
        encoder.encode(ROOT_USER_ID+SEPERATOR+assignRoles("None")+SEPERATOR+"root"+"\n"
        +id+SEPERATOR+role+SEPERATOR+username), await ref.open()
    );
    ref.close();

    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    const tx = await ref.open();
    await FsDb.createFile(HASH_FILE, {recursive: true, user: ROOT_USER_ID}, tx,
        encoder.encode(ROOT_USER_ID+SEPERATOR+hash1+"\n"
        +id+SEPERATOR+hash2)
    )
    const home = "/home/"+username;
    await FsDb.createDirectory(home, {recursive: true, soft: true, user: id}, tx);

    await FsDb.writeToFile(WHO_ID, {user: ROOT_USER_ID, type: "Rewrite"}, encoder.encode(id), tx);
    ref.close();

    user = {
        id, username, role, home
    };
    return true;
}

export async function requestSystemUserId(name:string):Promise<string> {
    if(name === ROOT_USER || name === "UserSystem")
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



export async function login(username:string, password:string):Promise<boolean> {
    if(!isSecure())
        throw new Error("Unable to login when Crypto library is unavailable!");

    if(user !== NO_USER)
        throw new Error("User is already logged in!");
    
    user = await validateUser(username, password);

    if(user === undefined)
        user = null;

    if(user === null)
        return false;

    const ref = Queue("readwrite");
    const tx = await ref.open();
    await FsDb.writeToFile(WHO_ID, {user:USER_SYSTEM_ID, type: "Rewrite"}, encoder.encode(user.id), tx);
    ref.close();
    return true;
}

export async function logout():Promise<void> {
    if(!isSecure())
        throw new Error("Unable to logout when Crypto library is unavailable!");

    const ref = Queue("readwrite");
    const tx = await ref.open();
    await FsDb.writeToFile(WHO_ID, {user:USER_SYSTEM_ID, type: "Rewrite"}, encoder.encode(), tx);
    ref.close();
    user = null;
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

export default {
    /** Get Username
     * 
     * @returns {string|null}
     */
    get username():string|null {
        return user?.username || null;
    },

    /** Get User Id
     * 
     * @returns {UserId}
     */
    get id():UserId {
        return user?.id || null;
    },

    /**
     * 
     */
    get home():string {
        return user? user.home: "/home/guest";
    },

    /** Is Root
     * 
     * @param {string} password
     * @returns {Promise<boolean>}
     */
    async isRoot(password?:string):Promise<boolean> {
        if(!isSecure())
            return false;
        
        if( user?.username === ROOT_USER)
            return true;

        if(password)
            return null !== await validateUser(ROOT_USER, password);

        return false;
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