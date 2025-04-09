/** @/Element/Attributes/Object
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object
* 
* @author Alex Malotky
*/
import {GlobalAttributes} from "../Attributes";

export default interface ObjectAttributes extends GlobalAttributes {
    data?: string,
    form?: string,
    height?: number,
    name?: string,
    type?: string,
    usemap?: string,
    width?: number,
}