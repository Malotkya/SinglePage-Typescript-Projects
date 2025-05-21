/** /System/Kernel/Errors
 * 
 * @author Alex Malotky
 */

/** Unauthorized Access Error
 * 
 */
export class UnauthorizedError extends Error {
    constructor(path:string, type:string) {
        super(`Dont have ${type.substring(0, type.indexOf("O"))} access to ${path}`)
    }
}

type FileErrorType = "Read"|"Write"|"Delete"|"Create"|"Link"|"Unlink"|"Execute"|"Open";

/** File System Error
 * 
 */
export class FileError extends Error {
    constructor( type:FileErrorType, message:string) {
        super(message)
        this.name = `FileError [${type}]`
    }
}