import { appendContent, createElement as _ } from "@/Element";
import { createFormInput, createTarget, InputElement } from "./input";
import {Point, Triangle} from "./point";

const ratio = Math.sqrt(3) / 2;
const frame = new Triangle(0, 0);

window.onload = () => {
    const [form, log] = createFormInput();
    const target = createTarget();

    appendContent(document.body, [
        form.elm, target
    ]);

    function run(count:number, last:Point, gl:CanvasRenderingContext2D):void {
        if(count < 0)
            return;
    
        let p = frame.next(last);
        log.prepend(_("p", `(${p.x}, ${p.y})`));
        gl.fillRect(p.x, p.y, 1, 1);

        setTimeout(()=>{
            run(count-1, p, gl);
        }, 1);
    }

    form.elm.addEventListener("submit", function main(event){
        event.preventDefault();
        target.innerHTML = "";
        log.innerHTML = "";

        const width = form.size;
        const height = Math.round(form.size * ratio);

        const canvas = _("canvas", {width, height});
        const gl = canvas.getContext("2d", {alpha: false});
        if(gl === null) {
            alert("Unable to load graphic context!");
            return;
        }
        target.appendChild(canvas);
        gl.fillStyle = "Yellow";

        const start = frame.start(width, height);

        run(width, start, gl);
    });
}

