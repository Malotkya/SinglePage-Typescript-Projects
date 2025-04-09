/** @/Element/Attributes/Style
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style
* 
* @author Alex Malotky
*/
import {GlobalAttributes} from "../Attributes";

export default interface StyleAttributes extends GlobalAttributes{
    blocking?:boolean,
    media?:string,
    nonce?:string,
    title?:string,
    type?:"text/css",
}