/** @/Element/Attributes/Select
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
* 
* @author Alex Malotky
*/
import {GlobalAttributes, Value} from "../Attributes";

export default interface SelectAttributes extends GlobalAttributes {
    autocomplete?: string,
    autofocus?: boolean,
    disabled?: boolean,
    form?: string,
    multiple?: boolean,
    name?: string,
    required?: boolean,
    size?: number,
    value?: Value
}