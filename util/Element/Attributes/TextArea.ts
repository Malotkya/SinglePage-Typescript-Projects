/** @/Element/Attributes/TextArea
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
* 
* @author Alex Malotky
*/
import {GlobalAttributes} from "../Attributes";

export default interface TextAreaAttributes extends GlobalAttributes {
    autocomplete?: "on"|"off",
    autocorrect?: "on"|"off",
    autofocus?:boolean,
    cols?: number,
    dirname?: string,
    form?: string,
    maxlength?: number,
    minlength?: number,
    name?: string,
    placeholder?: string,
    readonly?: boolean,
    required?: boolean,
    rows?: number,
    wrap?: "hard"|"soft"|"off"
}