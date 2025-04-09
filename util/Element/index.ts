/** @/Element
 * 
 * HTMLElement Helpers
 * 
 * @author Alex Malotky
 */
import { AttributeList, setAttributes, HTMLElementAttriburesMap } from "./Attributes";
export type Content = number|string|Element|HTMLSelectElement|null|Content[];

/** Is Content
 * 
 * @param {unknown} value 
 * @returns {boolean}
 */
export function isContent(value:unknown):value is Content {
    switch(typeof value) {
        case "number":
        case "string":
            return true;

        case "object":
            return value === null || value instanceof Element || Array.isArray(value);

        default:
            return false;
    }
}

/** Creates HTML Content
 * 
 * Streamlines creating an HTML element, assigning attributes, and adding children.
 * 
 * @param {string} name 
 * @param {Object} attributes 
 * @param {Array<Content>} children 
 * @returns {HTMLElement}
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(name:K, attributes?:HTMLElementAttriburesMap[K]|Content, ...children:Array<Content>):HTMLElementTagNameMap[K]
export function createElement(name:string, attributes:AttributeList|Content = {}, ...children:Array<Content>):HTMLElement {
    
    if(isContent(attributes)) {
        children.unshift(attributes);
        attributes = {};
    }
    
    const element = document.createElement(name);
    setAttributes(element, attributes);
    appendContent(element, children);

    return element;
}

/** Append Content to Element
 * 
 * @param {Element} element 
 * @param {Content} child 
 */
export function appendContent(element:Element, child:Content):void {
    if(child instanceof Element) {
        element.appendChild(child);
    } else if(Array.isArray(child)){
        for(let c of child) {
            appendContent(element, c);
        }
    } else if(child !== null && child !== undefined) {
        element.append(String(child));
    }
}