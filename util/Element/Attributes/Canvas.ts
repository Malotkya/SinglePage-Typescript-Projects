/** @/Element/Attributes/Canvas
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
 * 
 * @author Alex Malotky
 */
import {GlobalAttributes} from "../Attributes";

export default interface CanvasAttributes extends GlobalAttributes {
    height?: number,
    width?: number
}