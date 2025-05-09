/** /System/Sound/Buffer
 * 
 * @author Alex Malotky
 */
import { BeatIndex, calculateDuration, calculateDurationFromIndex } from "./Beats";
import { WaveName, WaveNameMap, CustomWave } from "./Wave";
import { customFloat } from "@";
import { getNoteFromIndex, NoteIndex } from "./Note";
import { calculateTempo, calculateTiming } from "./Context";

const RateBitCount = 6;
const RateBits = (1 << RateBitCount)-1;
const ChannelBitCount = 2;
const ChannelBits = (1 << ChannelBitCount)-1;
const TempoBitCount = 8;
const TempoBits = (1 << TempoBitCount)-1;

const SignatureBitCount = 4;
const SignatreBits = (1 << 4)+1;

function _init(bits1:number, bits2:number):{rate:number, count:number, tempo:number, signature:[number, number]} {
    const rate = bits1 & RateBits;
    bits1 >> RateBitCount;

    const count = (bits1 & ChannelBits)+1;
    bits1 >> ChannelBits;

    const tempo = bits1 & TempoBits;
    bits1 >> TempoBitCount;

    const top = bits2 & SignatreBits;
    bits2 >> SignatureBitCount;
    const bottom = bits2 & SignatreBits;

    return {
        rate, count, tempo,
        signature: [top, bottom]
    }
}

const NameBitCount = 2;
const NameBits = (1 << NameBitCount)-1;
const TableCountBitCount = 11;
const TableCountBits = (1 << TableCountBitCount)-1;

const [toWaveTableValue] = customFloat(true, 4, 11, 16);

function _channel(bits:number):{custom:false, index:0|1|2|3, name:WaveName}|{custom:true, index:0|1|2|3, count:number} {
    const custom = (bits & 1) === 1;
    bits >> 1;
    const index = (bits & ChannelBits) as 0|1|2|3;
    bits >> ChannelBitCount;

    const name = bits & NameBits;
    name >> NameBitCount;
    if(!custom){
        return {
            custom, index,
            name: WaveNameMap[name]
        }
    }

    const count = bits & TableCountBits;
    return {
        custom, index, count
    }
}

const BeatBitCount = 4;
const BeatBits = (1 << BeatBitCount)-1;
const NoteBitCount = 8;
const NoteBits = (1 << NoteBitCount)-1;
const FrequencyBitCount = 12;
const FrequencyBits = (1 << FrequencyBitCount)-1;
const [toFrequency] = customFloat(false, 4, 8, FrequencyBitCount);

function _sample(bits:number):{frequency:false, index:0|1|2|3, beat:BeatIndex, note:NoteIndex, cont:boolean}|{frequency:true, index:0|1|2|3, value:number, cont:boolean}|null {
    if(bits === 0)
        return null;

    const frequency = (bits & 1) === 0;
    bits >> 1;

    const index = (bits & ChannelBits) as 0|1|2|3;
    bits >> ChannelBitCount;

    if(frequency){
        const value = toFrequency(bits & FrequencyBits);
        value >> FrequencyBitCount;

        return {
            frequency, index, value,
            cont: bits === 1
        }
    }

    //Stored at 0 based index
    const beat = (bits & BeatBits)+1;
    bits >> BeatBitCount;

    //Stored at 0 based index
    const note = (bits & NoteBits)+1;
    bits >> NoteBitCount;

    return {
        frequency, index, beat, note,
        cont: bits === 1
    }
}


export default function ReadAudioBufferFile(array:Uint16Array):SoundData{
    
    const {rate, count, tempo, signature} = _init(array[0], array[1]);
    const channels:SoundInitData = {};

    let offset:number = 2;
    for(let i=0; i<count; ++i, ++offset) {
        const data = _channel(array[offset]);
        if(typeof channels[data.index] !== "undefined")
            console.warn(`Channel ${data.index} is being assigned twice!`);

        if(data.custom){
            const real:number[] = [];
            for(let j=0; j<data.count; ++j, ++offset)
                real.push(toWaveTableValue(array[offset]));

            const imag:number[] = [];
            for(let j=0; j<data.count; ++j, ++offset)
                imag.push(toWaveTableValue(array[offset]));
            
            channels[data.index] = {real, imag};
        } else {
            channels[data.index] = data.name;
        }
    }

    //Empty Sample Seperator
    if(_sample(array[++offset]) !== null)
        throw new Error("Buffer Data is maleformed!");
    
    return {
        tempo, signature, channels,
        buffer: ReadAudioBuffer(array, calculateTiming(signature[1]), calculateTempo(tempo), rate, offset)
    }
}

function ReadAudioBuffer(array:Uint16Array, timingLength:number, tempo:number, limit?:number, offset:number = 0):BufferData {
    let buffer:BufferData = [];
    limit = limit? Math.min(limit, MeasureLength): MeasureLength;
    const sampleRate = calculateDuration(1 / limit, tempo, timingLength);
    const measureRate = sampleRate * length;
    
    let baseStart:number = 0;
    while(offset < array.length){
        
        const measure:Measure = {};
        for(let m=0; m<limit; ++m) {
            let start:number = baseStart;

            const sample:Sample = {};
            for(let c=0; c<4; c++){
                const data = _sample(array[++offset]);

                if(data === null)
                    break;
                else if(data.frequency)
                    sample[data.index] = [start, data.value];
                else
                    sample[data.index] = [start, getNoteFromIndex(data.note), start+calculateDurationFromIndex(data.beat, tempo, timingLength)];

                if(!data.cont)
                    break;
            }

            measure[m as keyof Measure] = Object.keys(sample).length === 0? null: sample;
            start += sampleRate;
        }

        buffer.push(measure);
        baseStart += measureRate;
    }

    return buffer;
}

export type SoundData = {
    tempo:number,
    signature:[number, number],
    channels: SoundInitData
    buffer:BufferData
}

export type BufferData = Measure[];

export interface Measure {
     0?: Sample|null
     1?: Sample|null
     2?: Sample|null
     3?: Sample|null
     4?: Sample|null
     5?: Sample|null
     6?: Sample|null
     7?: Sample|null
     8?: Sample|null
     9?: Sample|null
    10?: Sample|null
    11?: Sample|null
    12?: Sample|null
    13?: Sample|null
    14?: Sample|null
    15?: Sample|null
    16?: Sample|null
    17?: Sample|null
    18?: Sample|null
    19?: Sample|null
    20?: Sample|null
    21?: Sample|null
    22?: Sample|null
    23?: Sample|null
    24?: Sample|null
    25?: Sample|null
    26?: Sample|null
    27?: Sample|null
    28?: Sample|null
    29?: Sample|null
    30?: Sample|null
    31?: Sample|null
    32?: Sample|null
    33?: Sample|null
    34?: Sample|null
    35?: Sample|null
    36?: Sample|null
    37?: Sample|null
    38?: Sample|null
    39?: Sample|null
    40?: Sample|null
    41?: Sample|null
    42?: Sample|null
    43?: Sample|null
    44?: Sample|null
    45?: Sample|null
    46?: Sample|null
    47?: Sample|null
}
export const MeasureLength = 48;

export interface Sample {
    0?:ChanelSoundData
    1?:ChanelSoundData
    2?:ChanelSoundData
    3?:ChanelSoundData
}
export const SampleLength = 4;

export type SoundInitData = {
    0?: ChanelInitData
    1?: ChanelInitData
    2?: ChanelInitData
    3?: ChanelInitData
}

export type ChanelSoundData = [frequency:number, start:number, stop?:number]
export type ChanelInitData  = WaveName|CustomWave;