/** @/Element/Attributes/Input
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
 * 
 * @author Alex Malotky
 */
import {GlobalAttributes, SpaceSeperatedList, Target, Value, Url} from "../Attributes";
import { EncodeType as FormEncodeType, Method as FormMethod} from "./Form";

export type InputType = "button"|"checkbox"|"color"|"date"|"datetime-local"|"email"|"file"|"hidden"|"image"|"month"|"number"|"password"|"radio"|"range"|"reset"|"search"|"submit"|"tel"|"text"|"time"|"url"|"week";

export default interface InputAttributes extends GlobalAttributes {
    type?: InputType,
    accept?: string,
    alt?: string,
    autocomplete?: SpaceSeperatedList,
    capture?: boolean|string,
    checked?: boolean,
    dirname?: string,
    disabled?: boolean,
    form?: string,
    formaction?: FormEncodeType,
    formmethod?: FormMethod,
    formnovalidate?: boolean,
    formtarget?: Target,
    height?: number,
    list?: string,
    max?: number,
    maxlength?: number,
    min?: number,
    minlength?: number,
    multiple?: boolean,
    name?: string,
    pattern?: string,
    placeholder?: string,
    popovertarget?: string,
    popovertargetaction?: "hide"|"show"|"toggle",
    readonly?: boolean,
    required?: boolean,
    size?: number,
    src?: Url,
    step?: number,
    value?: Value,
    width?: number
}