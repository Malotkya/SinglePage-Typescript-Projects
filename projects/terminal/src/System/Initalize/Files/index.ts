import { SystemDirectory } from "..";
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
    } satisfies SystemDirectory;