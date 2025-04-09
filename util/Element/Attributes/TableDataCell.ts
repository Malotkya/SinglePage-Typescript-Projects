/** @/Element/Attributes/TableDataCell
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
* 
* @author Alex Malotky
*/
import {GlobalAttributes, SpaceSeperatedList} from "../Attributes";

export default interface TableDataCellAttributes extends GlobalAttributes {
    colspan?: number,
    headers?: SpaceSeperatedList,
    rowspan?: number
}