/** @/Element/Attributes/Video
* 
* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
* 
* @author Alex Malotky
*/
import {CrossOrigin, GlobalAttributes, Url} from "../Attributes";

export default interface VideoAttributes extends GlobalAttributes {
    autoplay?: boolean,
    controls?: boolean,
    controlslist?: string,
    crossorigin?: CrossOrigin,
    disabplepictureinpicture?: boolean,
    disableremoteplayback?: boolean,
    height?: number,
    loop?: boolean,
    muted?: boolean,
    playsinline?: boolean,
    poster?: string,
    preload?: "none"|"metadata"|"auto",
    src?: Url,
    width?: number
}