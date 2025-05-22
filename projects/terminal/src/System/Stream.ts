/** /System/Stream
 * 
 * @author Alex Malotky
 */
export {WriteFileStream, ReadFileStream, ReadWriteFileStream} from "./Kernel/Stream/File";
export {InputStream, OutputStream, InputBuffer, OutputBuffer} from "./Kernel/Stream/IO";
export {ReadStream, WriteStream} from "./Kernel/Stream";
import { comparePositions, HighlightMap, Position } from "./Display";
import { BufferValue } from "./Kernel/Stream";

/** Get Highlighted Helper Function
 * 
 * @param {string} buffer 
 * @param {HighlighMap} map 
 * @param {Position} pos 
 * @param {number} width 
 * @returns {string}
 */
export function getHighlightedFromBuffer(buffer:BufferValue<string>, map:HighlightMap, pos:Position, width:number):string {
    const [start, end] = map;
    let output:string = "";

    for(let i=0; i<buffer.length; i++){
        const char = buffer.charAt(i);

        if(comparePositions(pos, start) >= 0 && comparePositions(pos, end) <= 0)
            output += char;

        if(char == '\n' || char == '\r') {
            pos.x = 0;
            pos.y++;
        } else {
            pos.x++;
            if(pos.x > width) {
                pos.x = 0;
                pos.y++;
            }
        }
    }

    return output;
}