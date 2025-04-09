/** @/Element/Attributes/EmbedExternal
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed
 * 
 * @author Alex Malotky
 */
import {GlobalAttributes, Url} from "../Attributes";

export default interface EmbedExternalAttributes extends GlobalAttributes {
    height?: number,
    src?: Url,
    type?: string,
    width?: number
}