/** @/Element/Attributes/Base
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
 * 
 * @author Alex Malotky
 */
import { AttributeList, Target, Url } from "../Attributes";

export default interface BaseAttributes extends AttributeList{
    href?:Url,
    target?:Target
}