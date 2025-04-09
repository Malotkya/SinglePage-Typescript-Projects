/** @/Element/Attributes/OptionGroup
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup
* 
* @author Alex Malotky
*/
import {GlobalAttributes} from "../Attributes";

export default interface OptionGroupAttributes extends GlobalAttributes {
    disabled?: boolean,
    label?: string,
}