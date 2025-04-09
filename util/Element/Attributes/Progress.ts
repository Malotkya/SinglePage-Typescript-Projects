/** @/Element/Attributes/Progress
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress
* 
* @author Alex Malotky
*/
import {GlobalAttributes} from "../Attributes";

export default interface ProgressAttribures extends GlobalAttributes {
    max?: number,
    value?: number,
}