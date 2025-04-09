/** @/Element/Attributes/Output
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output
* 
* @author Alex Malotky
*/
import {GlobalAttributes} from "../Attributes";

export default interface OutputAttributes extends GlobalAttributes {
    for?: string,
    form?: string,
    name?: string,
}