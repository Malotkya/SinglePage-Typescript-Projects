/** @/Element/Attributes/Audio
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
 * 
 * @author Alex Malotky
 */
import {GlobalAttributes, CrossOrigin, Url} from "../Attributes";

export default interface AudioAttributes extends GlobalAttributes {
    autoplay?: boolean,
    controls?: boolean,
    controlslist?: "nodownload"|"nofullscreen"|"noremoteplayback",
    crossorigin?: CrossOrigin,
    disalberemoteplayback?:boolean,
    loop?: boolean,
    muted?: boolean
    preload?: "none"|"metadata"|"auto",
    src?:Url
}