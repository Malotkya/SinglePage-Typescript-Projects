/** @/Element/Attributes/Button
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button
 * 
 * @author Alex Malotky
 */
import {GlobalAttributes, Target, Value, Pressed, Checked, Selected} from "../Attributes";
import { EncodeType as FormEncodeType, Method as FormMethod} from "./Form";

export default interface ButtonAttributes extends GlobalAttributes {
    autofocus?: boolean,
    disabled?: boolean,
    form?: string,
    formaction?: string,
    formenctype?: FormEncodeType,
    formmethod?: FormMethod,
    formnovalidate?: boolean,
    formtarget?: Target,
    name?: string,
    popovertarget?: string,
    popovertargetaction?: "hide"|"show"|"toggle",
    type?: "submit"|"resset"|"button"|"cancel",
    value?: Value,

    /* Aria State Information */
    ariaPressed?:Pressed,
    ariaChecked?: Checked,
    ariaSelected?: Selected
}