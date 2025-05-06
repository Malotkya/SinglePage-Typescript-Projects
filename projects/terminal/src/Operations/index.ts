import { SystemDirectory } from "../Initalize";
import terminal from "./terminal.cf";

export default {
    "bin": {},
    "etc": {
        "terminal.cf": [775, terminal]
    },
    "sys": {},
    "tmp": {},
    "home": {},
    "root": {}
} satisfies SystemDirectory;