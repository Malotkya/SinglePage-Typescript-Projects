/** @/Element/Attributes/TableHeader
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
* 
* @author Alex Malotky
*/
import {GlobalAttributes} from "../Attributes";

export default interface TableHeaderAttributes extends GlobalAttributes {
    abbr?: string,
    colspan?: number,
    headers?: string,
    rowspan?: number,
    scope?: "row"|"col"|"rowgroup"|"colgroup"
}