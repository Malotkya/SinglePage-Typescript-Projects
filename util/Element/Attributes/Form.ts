/** @/Element/Attributes/Form
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form
 * 
 * @author Alex Malotky
 */
import {GlobalAttributes, SpaceSeperatedList, Target, Url} from "../Attributes";

export type FormRel   = "external"|"help"|"lisence"|"next"|"nofollow"|"noopener"|"noreffer"|"prev"|"search";
export type EncodeType = "application/x-www-form-urlencoded"|"multipart/form-data"|"text/plain"
export type Method = "post"|"get"|"dialog"|"delete"|"put";

export default interface FormAttributes extends GlobalAttributes {
    accept?: string,
    acceptCharset?: SpaceSeperatedList,
    autocomplete?:"on"|"off",
    name?: string,
    rel?: FormRel,
    action?: Url,
    enctype?: EncodeType,
    method?: Method,
    novalidate?: boolean,
    target?: Target, 
}