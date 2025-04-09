/** @/Element/Attributes/Details
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details
 * 
 * @author Alex Malotky
 */
import {GlobalAttributes} from "../Attributes";

export default interface DetailsAttributes extends GlobalAttributes {
    open?:boolean,
    name?:string
    //ontoggle?: Function
}