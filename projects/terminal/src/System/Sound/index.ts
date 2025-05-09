/** /System/Terminal/Sound
 * 
 * This file contains all the information needed when interacting with the
 * audio context.
 * 
 * @author Alex Malotky
 */
import System from "..";
import Encoding from "../Files/Encoding";
import ReadAudioBufferFile, {BufferData, SampleLength, Sample, ReadAudioBuffer} from "./Buffer";
import SoundContext, {BaseSoundInterface} from "./Context";

//Sound Context
let ctx:SoundContext|null = null;

/** Init Sound Context
 * 
 */
export function initSound() {
    const ctr:undefined|typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if(ctr)
        ctx = SoundContext(ctr);
    else
        System.println("Warning: Unable to load AudioContext!  No sound will be available!");
}

/** Play Helper Function
 * 
 * @param {BufferData} buffer 
 */
function _play(buffer:BufferData) {
    const time = ctx!.currentTime;

    for(const measure of buffer) {
        for(const sample of measure){

            if(sample === null || sample === undefined)
                continue;

            for(let j=0; j<SampleLength; j++){
                const channel = sample[j as keyof Sample];
                if(channel){
                    const [freq, start, stop] = channel;
                    ctx!.channel[j as keyof Sample].play(freq, time+start, stop?time+stop:undefined)
                }
            }
        }
    }
}

/** Assert Sound Context is Initiated
 * 
 */
function _assert():SoundContext {
    if(ctx === null)
        throw new Error("No sound context!");

    return ctx;
}

/** Public Sound Interface
 * 
 */
interface Sound extends BaseSoundInterface{
    playFile:(audio:Encoding|Uint16Array)=>void
    playSound:(audio:Encoding|Uint16Array, sampleRate?:number)=>void
}

/** Public Sound Interface
 * 
 */
export default {
    /** Get Sound Context Timing
     * 
     */
    get timing(){
        return _assert().timing
    },

    /** Get Sound Context Tempo
     * 
     */
    get tempo(){
        return _assert().tempo
    },

    /** Set Sound Context Tempo from
     * 
     * @param {string} value bpm
     */
    setTempo(value:number) {
        _assert().setTempo(value);
    },

    /** Get Channels
     * 
     */
    get channel() {
        return _assert().channel
    },

    /** Play Audio File
     * 
     * @param {Encoding|Uint16Array} audio 
     */
    playFile(audio:Encoding|Uint16Array) {
        const ctx = _assert();

        if(audio instanceof Encoding)
            audio = audio.Array(16);
    
        const {tempo, signature, channels, buffer} = ReadAudioBufferFile(audio);
        ctx.setTempo(tempo);
        ctx.timing.set(signature[0], signature[1]);
        for(let i=0; i<SampleLength; i++) {
            const data = channels[i as keyof Sample]
            if(data) 
                ctx.channel[i as keyof Sample].set(data);
        }
    
        _play(buffer);
    },

    /** Play Audio Sound
     * 
     * @param {Encoding|Uint16Array} audio 
     */
    playSound(audio:Encoding|Uint16Array, sampleRate:number = 4) {
        const ctx = _assert();
    
        if(audio instanceof Encoding)
            audio = audio.Array(16);
    
        _play(ReadAudioBuffer(audio, ctx.timing.length, ctx.tempo, sampleRate));
    }
} satisfies Sound;