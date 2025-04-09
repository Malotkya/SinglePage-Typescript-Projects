/** @/Element/Attributes/DeletedText
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del
 * 
 * @author Alex Malotky
 */
import {GlobalAttributes} from "../Attributes";

export default interface DeletedText extends GlobalAttributes {
    cite?: string,
    datetime?: string|Date
}