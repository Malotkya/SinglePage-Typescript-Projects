/** /System/Kernel/Sound/Beats
 * 
 * Stored in 4bits
 * Index is 1 based to match 1 to whole.
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

//Valid Beat Values
export type Beat = (typeof BeatMap[BeatName])|0;

//Beat Names
export type BeatName = keyof typeof BeatMap;

//Beat Map Index (Starts at 1)
export type BeatIndex = (keyof typeof BeatIndex)&number;

/**Get Beat From Name
 * 
 * @param {BeatName} name 
 * @returns {Beat}
 */
export function getBeatFromName(name:BeatName):Beat {
    return BeatMap[name] || 0;
}

/** Get Beat From Index
 * 
 * @param {BeatIndex} index 1 - 16
 * @returns {Beat}
 */
export function getBeatFromIndex(index:BeatIndex):Beat {
    if(index < 1 || index > BeatIndex.length)
        return 0;

    return BeatMap[BeatIndex[index-1]];
}

/** Calculate Duration From Beat Name
 * 
 * @param {BeatName} name 
 * @param {number} tempo 
 * @param {number} length 
 * @returns {number}
 */
export function calculateDurationFromName(name:BeatName, tempo:number, length:number):number {
    const b = getBeatFromName(name);
    return calculateDuration(b, tempo, length)
}

/** Calculate Duration From Index
 * 
 * @param {BeatIndex} index 1 - 16
 * @param {number} tempo 
 * @param {number} length 
 * @returns {number}
 */
export function calculateDurationFromIndex(index:BeatIndex, tempo:number, length:number):number {
    const b = getBeatFromIndex(index);
    return calculateDuration(b, tempo, length)
}

/** Calculate Duration Helper Function
 * 
 * @param {number} beat 
 * @param {number} tempo 
 * @param {number} length 
 * @returns {number}
 */
export function calculateDuration(beat:number, tempo:number, length:number):number {
    return beat * tempo / length * 10;
}