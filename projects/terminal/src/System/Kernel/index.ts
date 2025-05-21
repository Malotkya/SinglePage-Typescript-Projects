import { initFilestoreDatabase } from "./File/TransactionQueue";
import { initSound } from "./Sound";
import { hardInit as initUserSystem} from "./User";
import { Success, Failure, InitalizeResult } from "./Initalize";
import User from "./User";

import Encoding from "./Encoding";
import * as Path from "./Path";
export {Path, Encoding};

export async function initKernal():Promise<InitalizeResult<undefined>> {
    try {
        const sound = initSound();
        if(sound.type === "Failure")
            return sound;

        const user = initUserSystem();
        if(user.type === "Failure")
            return user;

        const file = await initFilestoreDatabase();
        if(file.type === "Failure")
            return file;

        const io = await initStdIO();
        if(io.type === "Failure")
            return io;

    } catch(e:any){
        if( !(e instanceof Error))
            e = new Error(String(e));

        return Failure(e);
    }

    return Success();
}

import { getDisplay } from "./Display";
import DisplayContext from "./Display/Context";
import Queue from "./File/TransactionQueue";
import {getSize, getInfo, remove, copy, move, changeMode, createDirectory, readDirectory, createLink, unlink, createFile, writeToFile, readFile, openFile} from "./File";
import { getBeatFromName } from "./Sound/Beats";
import { getNoteFromName } from "./Sound/Note";
import ReadAudioBufferFile, { ReadAudioBuffer } from "./Sound/Buffer";
import SoundContext from "./Sound/Context";
import { getSound } from "./Sound";
import { initStdIO } from "./IO";
import * as Keyboard from "./Keyboard";
import * as Mouse from "./Mouse";

export default interface Kernel {
    readonly Display:DisplayContext
    readonly File: {
        readonly Queue: typeof Queue
        readonly getSize: typeof getSize
        readonly getInfo: typeof getInfo
        readonly remove: typeof remove
        readonly copy: typeof copy
        readonly move: typeof move
        readonly changeMode: typeof changeMode
        readonly createDirectory: typeof createDirectory
        readonly readDirectory: typeof readDirectory
        readonly createLink: typeof createLink
        readonly unlink: typeof unlink
        readonly createFile: typeof createFile
        readonly writeToFile: typeof writeToFile
        readonly readFile: typeof readFile
        readonly openFile: typeof openFile
    }
    readonly Audio: SoundContext
    readonly Sound: {
        readonly getBeat: typeof getBeatFromName
        readonly getNote: typeof getNoteFromName
        readonly readAudioFile: typeof ReadAudioBufferFile
        readonly readAudioBuffer: typeof ReadAudioBuffer
    }
    readonly Keyboard: typeof Keyboard
    readonly Mouse: typeof Mouse
}

export default async function Kernel(password?:string):Promise<Kernel> {
    if(await User.isRoot(password))
        new Error("Unauthorized to access the Kernel!");

    return {
        get Display() {
            return getDisplay()!;
        },
        get File() {
            return {Queue, getSize, getInfo, remove, copy, move, changeMode, createDirectory, readDirectory, createLink, unlink, createFile, writeToFile, readFile, openFile}
        },
        get Audio(){
            return getSound()!;
        },
        get Sound(){
            return {
                getBeat: getBeatFromName,
                getNote: getNoteFromName,
                readAudioFile: ReadAudioBufferFile,
                readAudioBuffer: ReadAudioBuffer
            }
        },
        get Keyboard(){
            return Keyboard
        },
        get Mouse(){
            return Mouse
        }
    }
}