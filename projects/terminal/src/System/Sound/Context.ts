/** /System/Sound/Context
 * 
 * @author Alex Malotky
 */
import { BeatName, calculateDurationFromName } from "./Beats";
import { NoteName, Note, getNoteFromName } from "./Note";
import { CustomWave, WaveName } from "./Wave";
import {SampleLength} from "./Buffer";

/** Sound Context Interface
 * 
 */
export default interface SoundContext extends AudioContext, BaseSoundInterface {};

export type BaseSoundInterface = {
    timing: Signature,
    readonly tempo: number,
    setTempo:(v:number)=>void
    channel: {
        readonly 0: Channel,
        readonly 1: Channel,
        readonly 2: Channel,
        readonly 3: Channel
    }
}

/** Sound Context Constructor
 * 
 * @param {typeof AudioContext} ctr 
 */
export default function SoundContext(ctr:typeof AudioContext):SoundContext {
    let tempo:number = 0.5;
    let channels:Channel[] = [];

    const ctx = (new ctr()) as SoundContext;
    Object.defineProperty(ctx, 'tempo', {
        get: function(){return tempo}
    });
    ctx.setTempo = function setTempo(value:number){
        tempo = calculateTempo(value);
    };
    ctx.timing = Signature();
    ctx.channel = <any>{};

    for(let i=0; i<SampleLength; i++){
        channels.push(Channel(ctx));
        Object.defineProperty(ctx.channel, i, {
            get: function(){return channels[i]}
        });
    };

    return ctx;
}

/** Calulate Tempo
 * 
 * @param {number} value 
 * @returns {number}
 */
export function calculateTempo(value:number):number {
    return 60 / value;
}

/** Music Signature
 * 
 */
export interface Signature {
    readonly beats:number
    readonly length:number
    set:(top:number, bottom:number)=>void
}

//Signatre to Beat Leanth Ratio
const SignatureRatio:Record<number, number|undefined> = {
    2: 6,
    4: 3,
    8: 4.50
}

/** Calculate Timing Helper function
 * 
 * Will automatically convert to 4 if the value is invalid instead of throwing error.
 * 
 * @param {number} value 
 * @returns {number}
 */
export function calculateTiming(value:number):number {
    if(SignatureRatio[value] === undefined)
        return SignatureRatio[4]!

    return SignatureRatio[value];
}

/** Signature Constructor
 * 
 * Defautls to 4/4 time signature.
 * 
 * @param {number} [top]
 * @param {nubmer} [bottom] 
 * @returns {Signature}
 */
function Signature(top:number = 4, bottom:number = 4):Signature {
    let beats = top;
    if(SignatureRatio[bottom] === undefined){
        console.warn(`Signature length '${bottom}' and defaulting to 4!`);
        bottom = 4;
    }
    let length = SignatureRatio[bottom]!;

    return {
        get beats():number {
            return beats;
        },
        get length():number {
            return length;
        },
        set(top:number, bottom:number) {
            const test = SignatureRatio[bottom];
            if(test === undefined)
                throw new TypeError(`Signature length '${bottom}' is unsuported!`);
            beats = top;
            length = test;
        }
    }
}

/** Sound Channel
 * 
 */
export interface Channel {
    play:{
        (frequency?:number, start?:number, end?:number): void,
        (note:NoteName|Note, beat:BeatName): void
    }
    set:(value:CustomWave|WaveName)=>void
    stop:()=>void
}

/** Channel Constructor
 * 
 * @param {SoundContext} ctx 
 * @returns {Channel}
 */
function Channel(ctx:SoundContext):Channel{
    const node = ctx.createOscillator();

    return {
        set(value:CustomWave|WaveName) {
            if(typeof value === "string") {
                node.type = value;
            } else {
                node.type = "custom";
                node.setPeriodicWave(value);
            }
        },
        play(frequency:number|NoteName = -1, start?:number|BeatName, end?:number){
            if(typeof frequency === "string")
                frequency = getNoteFromName(frequency);

            if(frequency > 0) {
                node.frequency.value = frequency;
            } else if(frequency === 0) {
                node.stop(-1);
                return;
            }
            if(typeof start === "string"){
                end = ctx.currentTime + calculateDurationFromName(start, ctx.tempo, ctx.timing.length);
                start = ctx.currentTime;
            }

            node.start(start);
            if(end)
                node.stop(end);
        },
        stop(){
            node.stop();
        }
    }
};