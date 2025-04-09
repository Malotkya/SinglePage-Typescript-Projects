/** @/Element/Attribute
 * 
 * Element Attributes Helpers
 * 
 * @author Alex Malotky
 */

/** Attribute Type
 * 
 * Any acceptable form of attribute content for creation of HTML Elements
 */
type Attribute = string|number|boolean|EventHandler<any>|Url|Date|undefined|string[];
export default Attribute;

/** Atribute List / Map
 * 
 * How attributes are stored
 */
export type AttributeList = Record<string, Attribute>;


/************************************************************** Main Attribute Types ******************************************************************************/
export type RefferPolicy = "no-referrer"|"no-referrer-when-downgrade"|"origin"|"origin-when-cross-origin"|"unsafe-url";
export type CrossOrigin = "anonymous"|"use-credentials";
export type Priority = "high"|"low"|"auto";
export type Target = "_self"|"_blank"|"_parent"|"_top";
export type SpaceSeperatedList = string|string[];
export type Enumerable = "true"|"false";
export type Value = number|string;
export type Url = URL|string;
export type EventHandler<E extends Event> = (event:E)=>Promise<void>|void;

//https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes
export interface GlobalAttributes extends AriaGlobalAttributes {
   accesskey?:string,
   autocapitalize?: "none"|"off"|"sentences"|"on"|"words"|"characters",
   autofocus?:boolean,
   class?:SpaceSeperatedList,
   contenteditable?:Enumerable|"plaintext-only",
   /* data-*?: any */
   dir?: "ltr"|"rtl"|"auto",
   draggable?: Enumerable,
   enterkeyhint?: "enter"|"done"|"go"|"next"|"previous"|"search"|"send",
   exportparts?:SpaceSeperatedList,
   hidden?: boolean|"until-found",
   id?: string,
   inert?: boolean,
   inputmode?: "none"|"text"|"decimal"|"numeric"|"tel"|"search"|"email"|"url",
   is?: string,
   itemid?: string,
   itemprop?: string,
   itemref?: string,
   itemscope?: string,
   itemtype?: string,
   lang?: string,
   nonce?: string,
   part?: SpaceSeperatedList,
   popover?: boolean,
   role?: "toolbar"|"tooltip"|"feed"|"math"|"presentation"|"note"|"scrollbar"|"searchbox"|"separator"|"slider"|"spinbutton"|"switch"|"tab"|"tabpanel"|"treeitem"|"combobox"|"menu"|"menubar"|"tablist"|"tree"|"treegrid",
   slot?: string,
   spellcheck?: boolean,
   style?: string, /*Style Array??*/
   tabindex?: number,
   title?: string,
   translate?: "yes"|"no",
   //virtualkeyboardpolicy?: "auto"|"manual",
}

/** Convert Attribute Name
* 
* converts camel case names to dash/kebab case.
* 
* @param {string} name 
* @returns {string}
*/
function convertName(name:string):string {
    return name.replaceAll(/([A-Z])/g, ("-$1")).toLocaleLowerCase();
}

/** Set Event Attriute
 *  
 * @param {Element} element 
 * @param {string} name 
 * @param {string|EventHandler} value 
 */
function setEventAttribute(element:Element, name:string, value:string|EventHandler<any>) {
    switch(typeof value) {
        case "string":
            element.setAttribute(name.toLocaleLowerCase(), value);
            break;

        case "function":
            element.addEventListener(name.replace(/on/i, "").toLocaleLowerCase(), value);
            break;

        default:
            throw new TypeError("Event Attribute must a Function or string!");
    }
}

/** Set Normal Attribute
 * 
 * @param {Element} element 
 * @param {string} name 
 * @param {Attribute} value 
 */
function setNormalAttribute(element:Element, name:string, value:Attribute) {
    name = convertName(name);

    switch(typeof value){
        case "boolean":
            element.toggleAttribute(name, value);
            break;

        case "string":
            element.setAttribute(name, value);
            break;

        case "undefined":
            break;

        case "object":
            if(Array.isArray(value)) {
                element.setAttribute(name, value.join(" "));
                break;
            } else if(value instanceof URL) {
                element.setAttribute(name, value.toString());
                break;
            } else if(value instanceof Date) {
                element.setAttribute(name, value.toDateString());
                break;
            } else if(value === null) {
                element.setAttribute(name, "null");
                break;
            }

        default:
            element.setAttribute(name, String(value));
    }
}

/************************************************************** Aria Attribute Types ******************************************************************************/

/* Widget Region Attributes */
export type Autocomplete = "none"|"inline"|"list"|"both";
export type Checked = boolean;
export type Disabled = boolean;
export type Errormessage = string;
export type Expanded = boolean;
export type Haspopup = "menu"|"listbox"|"tree"|"grid"|"dialog"|boolean;
export type Hidden = boolean;
export type Invalid = boolean;
export type Modal = boolean;
export type Multiline = boolean;
export type Multilineselectable = boolean;
export type Orientation = "horizontal"|"vertical";
export type Placeholder = string;
export type Pressed = "mixed"|boolean;
export type Readonly = boolean;
export type Required = boolean;
export type Selected = boolean;
export type Sort = "ascending"|"descending"|"other"|"none";
export type Valuemax = number;
export type Valuemin = number;
export type Valuenow = number;
export type Valuetext = string;

/* Live Region Attributes */
export type Busy = boolean;
export type Live = "assertive"|"polite"|"off";
export type Relevant ="additions"|"all"|"removals"|"text"|"addions text";
export type Atomic = boolean;

/* Drag and Drop Attributes */
export type Dropeffect = "copy"|"execute"|"link"|"move"|"popup";
export type Grabbed = boolean;

/* Relationship Attributes */
export type Activedescendant = string;
export type Colcount = number;
export type Colindex = number;
export type Colspan = number;
export type Controls = string;
export type Describedby = SpaceSeperatedList;
export type Description = string;
export type Details = string;
export type Flowto = string;
export type Labelledby = SpaceSeperatedList;
export type Owns = SpaceSeperatedList;
export type Posinset = number;
export type Rowcount = number;
export type Rowindex = number;
export type Rowspan = number;
export type Setsize = number

/* Global Attributes */
export type Current = "page"|"step"|"location"|"date"|"time"|boolean;
export type Keyshortcuts = string;
export type Label = string;
export type Roledescription = string;

/** Aria Global Attributes
 * 
 */
export interface AriaGlobalAttributes extends AttributeList{
    ariaAtomic?: Atomic,
    ariaBusy?: Busy,
    ariaControls?: Controls,
    ariaCurrent?: Current,
    ariaDesribedby?: Describedby,
    ariaDescription?: Description,
    ariaDetails?: Details,
    ariaDesabled?: Disabled,
    ariaDropeffect?: Dropeffect,
    ariaErrormessage?: Errormessage,
    ariaFlowto?: Flowto,
    airaGrabbed?: Grabbed,
    ariaHaspopup?: Haspopup,
    ariaHidden?: Hidden,
    ariaInvalid?: Invalid,
    ariaKeyshrotcuts?: Keyshortcuts,
    ariaLabel?: Label,
    ariaLabelledby?: Labelledby,
    ariaLive?: Live,
    ariaOwns?: Owns,
    ariaRelevant?: Relevant,
    ariaRoledescription?: Roledescription
}

function setAriaAttribute(element:Element, name:string, value:Attribute) {
    name = convertName(name);
    switch(typeof value) {
        case "number":
            if(isNaN(value))
                console.warn("NaN passed as Aria Attribute value!");

            element.setAttribute(name, value.toString());
            break;

        case "boolean":
            element.setAttribute(name, value?"true":"false");
            break;

        case "string":
            element.setAttribute(name, value);
            break;

        case "undefined":
            return;

        case "object":
            if(Array.isArray(value)) {
                element.setAttribute(name, value.join(" "));
                break;
            }

        default:
            console.warn("Unknown value passed as Aria Attribute: ", value);
            element.setAttribute(name, String(value));
    }
}

/************************************************************** Attribute Functions *******************************************************************************/

/** Set Attributes to Element
 * 
 * @param {Element} element 
 * @param {Dictionary<Attribute>} attributes 
 */
export function setAttributes(element:Element, attributes:AttributeList):void{
    for(const name in attributes) {
        const value = attributes[name];

        if(name.includes("aria")) {
            setAriaAttribute(element, name, value);
        } if(typeof value === "function" || (name.includes("on") && typeof value === "string")) {
            setEventAttribute(element, name, value);
        } else {
            setNormalAttribute(element, name, value);
        }
    }
}

/************************************************************** Attribute Type Map ********************************************************************************/
import AnchorAttributes from "./Anchor";
import AreaAttributes from "./Area";
import AudioAttributes from "./Audio";
import BaseAttributes from "./Base";
import BlockQuotationAttributes from "./BlockQuotation";
import ButtonAttributes from "./Button";
import CanvasAttributes from "./Canvas";
import TableColumnAttributes from "./TableColumn";
import TableColumnGroupAttributes from "./TableColumnGroup";
import DataAttributes from "./Data";
import DeletedText from "./DeletedText";
import DetailsAttributes from "./Details";
import DialogAttributes from "./Dialog";
import EmbedExternalAttributes from "./EmbedExternal";
import FieldSetAttributes from "./FieldSet";
import FormAttributes from "./Form";
import HeadAttributes from "./Head";
import InlineFrameAttributes from "./InlineFrame";
import ImageAttributes from "./Image";
import InputAttributes from "./Input";
import InsertedTextAttributes from "./InsertedText";
import LabelAttributes from "./Label";
import ListItemAttributes from "./ListItem";
import LinkAttributes from "./Link";
import ImageMapAttributes from "./ImageMap";
import MarkTextAttributes from "./MarkText";
import MetaAttributes from "./Meta";
import MeterAttributes from "./Meter";
import ObjectAttributes from "./Object";
import OrderedListAttributes from "./OrderedList";
import OptionGroupAttributes from "./OptionGroup";
import OptionAttributes from "./Option";
import OutputAttributes from "./Output";
import ProgressAttribures from "./Progress";
import InlineQuotationAttributes from "./InlineQuotation";
import ScriptAttributes from "./Script";
import SelectAttributes from "./Select";
import SlotAttributes from "./Slot";
import StyleAttributes from "./Style";
import TableDataCellAttributes from "./TableDataCell";
import TableHeaderAttributes from "./TableHeader";
import TemplateAttributes from "./Template";
import TextAreaAttributes from "./TextArea";
import TimeAttributes from "./Time";
import TrackAttributes from "./Track";
import VideoAttributes from "./Video";

/** Normal Element Attriutes Map
 * 
 */
export interface HTMLElementAttriburesMap extends Record<keyof HTMLElementTagNameMap, GlobalAttributes>{
   a: AnchorAttributes,
   abbr: GlobalAttributes,
   address: GlobalAttributes,
   area: AreaAttributes,
   article: GlobalAttributes,
   aside: GlobalAttributes,
   audio: AudioAttributes,
   b: GlobalAttributes,
   base: BaseAttributes,
   br: GlobalAttributes,
   bdi: GlobalAttributes,
   bdo: GlobalAttributes,
   blockquote: BlockQuotationAttributes,
   button: ButtonAttributes,
   canvas: CanvasAttributes,
   caption: GlobalAttributes
   cite: GlobalAttributes,
   code: GlobalAttributes,
   col: TableColumnAttributes,
   colgroup: TableColumnGroupAttributes,
   data: DataAttributes,
   datalist: GlobalAttributes,
   dd: GlobalAttributes,
   del: DeletedText,
   details: DetailsAttributes,
   dfn: GlobalAttributes,
   dialog: DialogAttributes,
   div: GlobalAttributes,
   dl: GlobalAttributes,
   dt: GlobalAttributes,
   em: GlobalAttributes,
   embed: EmbedExternalAttributes,
   //fencedframe: {experimental}
   fieldset: FieldSetAttributes,
   figcaption: GlobalAttributes,
   figure: GlobalAttributes,
   footer: GlobalAttributes,
   form: FormAttributes,
   h1: GlobalAttributes,
   h2: GlobalAttributes,
   h3: GlobalAttributes,
   h4: GlobalAttributes,
   h5: GlobalAttributes,
   h6: GlobalAttributes,
   hr: GlobalAttributes,
   head: HeadAttributes,
   header: GlobalAttributes,
   hgroup: GlobalAttributes,
   i: GlobalAttributes,
   iframe: InlineFrameAttributes,
   img: ImageAttributes,
   input: InputAttributes,
   ins: InsertedTextAttributes,
   kbd: GlobalAttributes,
   label: LabelAttributes,
   legend: GlobalAttributes,
   li: ListItemAttributes,
   link: LinkAttributes,
   main: GlobalAttributes,
   map: ImageMapAttributes,
   mark: MarkTextAttributes,
   menu: GlobalAttributes,
   meta: MetaAttributes,
   meter: MeterAttributes,
   nav: GlobalAttributes,
   noscript: GlobalAttributes,
   object: ObjectAttributes,
   ol: OrderedListAttributes,
   optgroup: OptionGroupAttributes,
   option: OptionAttributes,
   output: OutputAttributes,
   p: GlobalAttributes,
   picture: GlobalAttributes,
   //portal: {experimental}
   pre: GlobalAttributes,
   progress: ProgressAttribures,
   q: InlineQuotationAttributes,
   rp: GlobalAttributes,
   rt: GlobalAttributes,
   ruby: GlobalAttributes,
   s: GlobalAttributes,
   samp: GlobalAttributes,
   script: ScriptAttributes,
   search: GlobalAttributes,
   section: GlobalAttributes,
   select: SelectAttributes,
   slot: SlotAttributes,
   small: GlobalAttributes,
   source: GlobalAttributes,
   span: GlobalAttributes,
   strong: GlobalAttributes,
   style: StyleAttributes,
   sub: GlobalAttributes,
   summary: GlobalAttributes,
   sup: GlobalAttributes,
   table: GlobalAttributes,
   tbody: GlobalAttributes,
   td: TableDataCellAttributes,
   template: TemplateAttributes,
   textarea: TextAreaAttributes,
   tfoot: GlobalAttributes,
   th: TableHeaderAttributes,
   thead: GlobalAttributes,
   time: TimeAttributes,
   title: GlobalAttributes,
   tr: GlobalAttributes,
   track: TrackAttributes,
   u: GlobalAttributes,
   ul: GlobalAttributes,
   var: GlobalAttributes,
   video: VideoAttributes,
   wbr : GlobalAttributes
}