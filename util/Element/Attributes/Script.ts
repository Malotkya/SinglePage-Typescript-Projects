/** @/Element/Attributes/Script
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
* 
* @author Alex Malotky
*/
import {GlobalAttributes, CrossOrigin, Priority, RefferPolicy, Url} from "../Attributes";

export default interface ScriptAttributes extends GlobalAttributes{
    async?:boolean,
    attributeionsrc?:string|boolean,
    blocking?:"render"|boolean,
    corssorigin?:CrossOrigin,
    defer?:boolean,
    fetchpriority?: Priority,
    integrity?:string,
    nomodule?:boolean,
    nonce?:string,
    refferpolicy?: RefferPolicy,
    src?: Url,
    type?: "importmap"|"module"|"specultaionrules",
    charset?:"utf-8",
    language?:string,
}