/** /System/Keyboard
 * 
 * @author Alex Malotky
 */
import { KeyCode, KeyboardData, isKeyPressed } from "./Kernel/Keyboard";
export type {KeyCode, KeyboardData};

export default {
    get isKeyPressed(){
        return isKeyPressed;
    }
}