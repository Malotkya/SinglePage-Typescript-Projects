/** @/Element/Attributes/Link
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
 * 
 * @author Alex Malotky
 */
import {GlobalAttributes, CrossOrigin, Priority, RefferPolicy, Url} from "../Attributes";

// https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel
export type LinkRel   = "alternate"|"author"|"canonical"|"dns-prefetch"|"expect"|"help"|"icon"|"manifest"|"modulepreload"|"next"|"pingback"|"preconnect"|"prefetch"|"preload"|"prerender"|"prev"|"privacy-policy"|"search"|"stylesheet"|"terms-of-service";

export default interface LinkAttributes extends GlobalAttributes {
    as?:"audio"|"document"|"embed"|"fetch"|"font"|"font"|"image"|"object"|"script"|"style"|"track"|"video"|"worker",
    blocking?:boolean,
    corssorigin?:CrossOrigin,
    disabled?:boolean,
    fetchpriority?: Priority,
    href: Url,
    hreflang?:string,
    imagesizes?:string,
    imagesrcset?:string,
    integrity?:string,
    media?:string,
    refferpolicy?: RefferPolicy,
    rel: LinkRel,
    sizes?:string,
    title?:string,
    type?:string,
    target?:string,
    charset?:string,
    rev?:string,
    name?:string /* unofficial */
}