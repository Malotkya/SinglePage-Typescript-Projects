/** @/Element/Attributes/Area
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area
 * 
 * @author Alex Malotky
 */
import { GlobalAttributes, RefferPolicy, Target, SpaceSeperatedList, Url } from "../Attributes";
import { AnchorRel } from "./Anchor";

export default interface AreaAttributes extends GlobalAttributes{
    alt?: string,
    coords?: string,
    download?: boolean|string,
    href?: Url,
    ping?: SpaceSeperatedList,
    referrerpolicy?:RefferPolicy,
    rel?: AnchorRel,
    shape?: "rect"|"circle"|"poly",
    target?:Target,

}