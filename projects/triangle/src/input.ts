import {createElement as _} from "@/Element";
import {NumberOr} from "@";

export type InputElement = {
    elm: HTMLFormElement
    size: number
    count: number
}

export function createFormInput():[InputElement, HTMLElement] {
    const count = _("input", {type: "text", id: "count"});
    const size  = _("input", {type: "text", id: "size"});
    const log = _("div", {id: "log"});

    const form = _("form", {id: "form"},
        _("label", {for: "size"}, "Size of Triangle:"),
        size,
        _("label", {for: "count"}, "Number of Pixels:"),
        count,
        _("input", {type: "submit", value: "Run"}),
        log
    );

    return [{
        elm: form,
        get count() {
            return NumberOr(count.value, 0);
        },
        get size() {
            return NumberOr(size.value, 0);
        }
    }, log];
}

export function createTarget(){
    return _("div", {id: "target"});
}