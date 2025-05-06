import { SystemDirectory } from "../Initalize";
import terminal from "./terminal.cf";

export default {
    "bin": {},
    "etc": {
        "terminal.cf": [775, terminal]
    },
    "var": {
        "who": ""
    },
    "sys": {},
    "tmp": {},
    "home": {
        "guest": {}
    },
    "root": {}
} satisfies SystemDirectory;