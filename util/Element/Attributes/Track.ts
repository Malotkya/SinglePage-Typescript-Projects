/** @/Element/Attributes/Track
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
* 
* @author Alex Malotky
*/
import {GlobalAttributes, Url} from "../Attributes";

export default interface TrackAttributes extends GlobalAttributes {
    default?: boolean,
    kind?: "subtitles"|"captions"|"chapters"|"metadata",
    label?: string,
    src?: Url,
    srclang?: string
}