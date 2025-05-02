import { InitData } from "../System/Files";
import terminal from "./terminal.cf";

export default {
    "bin": {},
    "etc": {
        "terminal.cf": terminal
    },
    "sys": {},
    "tmp": {},
    "home": {
        "guest": {}
    },
    "root": {}
} satisfies InitData;