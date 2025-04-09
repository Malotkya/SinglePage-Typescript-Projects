/** @/Element/Attributes/MediaSource
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source
* 
* @author Alex Malotky
*/
import {GlobalAttributes, Url} from "../Attributes";

export default interface MediaSourceAttributes extends GlobalAttributes {
    type?: string,
    src?: Url,
    srcset?: string,
    sizes?: string,
    media?: string,
    height?: number,
    width?: number
}