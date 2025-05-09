/** Note Beat
 * 
 * Stored in 4bits
 * 
 * @author Alex Malotky
 */

//Max Size: 16
const BeatMap = {
    "whole": 1,
    "dotted-half": 0.75,
    "half": 0.5,
    "dotted-quarter": 0.375,
    "triplet-half": 0.333333,
    "quarter": 0.25,
    "dotted-eighth": 0.1875,
    "triplet-quarter": 0.166667,
    "eigth": 0.125,
    "dotted-sixteenth": 0.09375,
    "triplet-eighth": 0.083333,
    "sixteenth": 0.0625,
    "dotted-thirtysecond": 0.046875,
    "triplet-sixteenth": 0.041667,
    "thirtySecond": 0.03125,
    "triplet-thirtysecond": 0.020833
} as const;

//@ts-ignore
const BeatIndex:BeatName[] = Object.keys(BeatMap);

export type Beat = (typeof BeatMap[BeatName])|0;
export type BeatName = keyof typeof BeatMap;
export type BeatIndex = (keyof typeof BeatIndex)&number;

export function getBeatFromName(name:BeatName):Beat {
    return BeatMap[name] || 0;
}

export function getBeatFromIndex(index:BeatIndex):Beat {
    if(index < 0 || index >= BeatIndex.length)
        return 0;

    return BeatMap[BeatIndex[index]];
}

export function getDurationFromName(name:BeatName, tempo:number, length:number):number {
    const b = getBeatFromName(name);
    return _calculateDuration(b, tempo, length)
}

export function getDurationFromIndex(index:BeatIndex, tempo:number, length:number):number {
    const b = getBeatFromIndex(index);
    return _calculateDuration(b, tempo, length)
}

function _calculateDuration(beat:Beat, tempo:number, length:number):number {
    return beat * tempo / length * 10;
}