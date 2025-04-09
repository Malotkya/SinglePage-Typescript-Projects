

/** @/Element/Attributes/Meta
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta
 * 
 * @author Alex Malotky
 */
import {AttributeList} from "../Attributes";

export default interface MetaAttributes extends AttributeList {
    charset?:"utf-8",
    content?:string,
    httpEquiv?:"content-security-policy"|"content-type"|"default-style"|"x-ua-compatibl"|"refresh",
    name?:string
}