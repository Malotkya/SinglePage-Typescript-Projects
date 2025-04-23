/** /Terminal/Register/Defaults
 * 
 * These are the default constants that will be used by the app.  If there are
 * settings saved in a cookie those will be used instead.
 * 
 * @author Alex Malotky
 */
import Color from "@/Color";
import {SystemRegisterTypeMap} from "./types";

const Defaults:SystemRegisterTypeMap = {
    "Background_Color": new Color(0, 0, 0),
    "Font_Color": new Color(0, 255, 0),
    "Font_Size": 15,
    "Screen_Height": 30,
    "Screen_Width": 100
} as const;

export default Defaults;