export class UnauthorizedError extends Error {
    constructor(path:string, type:string) {
        super(`Dont have ${type.substring(0, type.indexOf("O"))} access to ${path}`)
    }
}

export class FileError extends Error {
    constructor( type:"Read"|"Write"|"Delete"|"Create"|"Link"|"Unlink", message:string) {
        super(message)
        this.name = `FileError [${type}]`
    }
}