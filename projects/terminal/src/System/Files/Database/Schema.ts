/** /System/Files/Database/Schema
 * 
 * @author Alex Malotky
 */
import { DBSchema, StoreKey, StoreValue } from "idb";
import { UserId } from "../../User";

export interface FolderDirectoryData {
    type: "Directory"
    owner: UserId
    mode: number
    links:number
    created: Date
    base: string
    path: string
}
export interface FileDirectoryData{
    type: "File"
    owner: UserId
    mode: number
    links:number
    listeners: number
    created: Date
    updated: Date
    path: string
    base: string
    ext: string
}
interface LinkDirectoryData{
    type: "Link"
    target: string
    owner: UserId
    mode: number
    links:number
    created: Date
    base: string
    ext?: string
    path: string
}

export type FileData = string;
export type DirectoryData = FolderDirectoryData|FileDirectoryData|LinkDirectoryData;

export type FileValue = StoreValue<FileDatabaseSchema, "File">;
export type DirectoryValue = StoreValue<FileDatabaseSchema, "Directory">;

type FileDatabaseSchema = {
    "File": {
        "key": string,
        "value": FileData,
    }
    "Directory": {
        "key": string,
        "value": DirectoryData
    }
}&DBSchema;
export default FileDatabaseSchema;