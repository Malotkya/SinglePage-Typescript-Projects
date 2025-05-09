/** /System/Sound/Wave
 * 
 * @author Alex Maltoky
 */

//Custom Wave Table Data
export type CustomWave = {
    real:number[]
    imag:number[]
}

//Wave Name Map
export const WaveNameMap =[
    "sine",
    "square",
    "sawtooth",
    "triangle"
] as const;

//Types of Waves by name.
export type WaveName = typeof WaveNameMap[number];

//Get Wave From Index
export function getWaveNameFromIndex(index:number):WaveName {
    if(index < 0 || index >= WaveNameMap.length)
        return "sine";

    return WaveNameMap[index];
}