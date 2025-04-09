/** @/Element/Attributes/Option
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
* 
* @author Alex Malotky
*/
import {GlobalAttributes, Value} from "../Attributes";

export default interface OptionAttributes extends GlobalAttributes {
    disabled?: boolean,
    label?: string,
    selected?: boolean,
    value?: Value
}