import Bios from "./System/Bios.wait";
import { reportKeyDown } from "./System/Keyboard";

window.onload = () => {
    const input = document.createElement("input");
    input.addEventListener("keydown", reportKeyDown);
    document.body.appendChild(input);
}
