/** /System/Mouse
 * 
 * @author Alex Malotky
 */
import { MouseButton, isButtonPressed, position } from "./Kernel/Mouse";
export type {MouseButton};

export default {
    get isButtonPressed(){
        return isButtonPressed;
    },
    get position(){
        return position();
    }
}