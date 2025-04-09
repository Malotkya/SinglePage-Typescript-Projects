/** @/Element/Attributes/OrderedList
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol
* 
* @author Alex Malotky
*/
import {GlobalAttributes} from "../Attributes";

export default interface OrderedListAttributes extends GlobalAttributes {
    reversed?: boolean,
    start?: number,
    type?: "a"|"A"|"i"|"I"|"1"
}