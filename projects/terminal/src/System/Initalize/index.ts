/** /System/Initalize
 * 
 */
import {Directory} from "../Kernel/Initalize";
import terminal from "./terminal.cf";

export default {
    "bin": {},
    "etc": {
        "terminal.cf": [775, terminal]
    },
    "var": {},
    "sys": {},
    "tmp": {},
    "home": {}
} satisfies Directory;

export {InitalizeResult, Success, Failure, File, Directory, startingFiles, extract} from "../Kernel/Initalize";