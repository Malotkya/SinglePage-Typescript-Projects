import { SystemDirectory } from "../../../Kernel/Initalize";
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