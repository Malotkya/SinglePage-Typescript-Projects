/** @/Element/Attributes/Tamplate
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
* 
* @author Alex Malotky
*/
import {GlobalAttributes} from "../Attributes";

export default interface TemplateAttributes extends GlobalAttributes {
    shadowrootmode?: "open"|"closed",
    shadowrootclonable?: boolean,
    shadowrootdelegatesfocuse?: boolean,
    shadowrootserializable?: boolean
}