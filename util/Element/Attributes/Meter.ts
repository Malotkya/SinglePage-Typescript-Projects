/** @/Element/Attributes/Meter
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter
 * 
 * @author Alex Malotky
 */
import {GlobalAttributes} from "../Attributes";

export default interface MeterAttributes extends GlobalAttributes {
    value?: number,
    min?: number,
    max?: number,
    low?: number,
    heigh?: number,
    optimum?: number,
    form?: string
}