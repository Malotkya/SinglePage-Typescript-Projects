/** Main
 * 
 * @author Alex Malotky
 */
import BuckshotListElement from "./BuckShotList";
import { createElement as _, appendContent } from "@/Element";

/** Build App
 * 
 * @returns {Array<HTMLElement>}
 */
function buildApp():HTMLElement[]{
    const numLive  = _("input", {id: "numLive", type: "number", value: 0});
    numLive.addEventListener("focus", ()=>numLive.select());
    const numBlank = _("input", {id: "numBlank", type: "number", value: 0});
    numBlank.addEventListener("focus", ()=>numBlank.select());
    const lblChance = _("span", {id: "lblChance"});

    const form = _("form",
        _("div", {class: "input"},
            _("label", {for: "numLive"}, "Live: "),
            numLive,
        ),
        _("div", {class: "input"},
            _("label", {for: "numBlank"}, "Blank: "),
            numBlank,
        ),
        _("div", {class: "button"},
            _("button", {id: "start"}, "Start")
        )
    );

    const list = new BuckshotListElement(0, 0);

    /** Start Handler
     * 
     */
    form.addEventListener("submit", (event)=>{
        event.preventDefault();

        list.liveCount  = Number(numLive.value);
        list.blankCount = Number(numBlank.value);
        list.init();

        lblChance.textContent = (list.chance()*100).toFixed(2)+"%";
    });

    /** Change Handler
     * 
     */
    list.addEventListener("change", (event)=>{
        event.stopPropagation();
        lblChance.textContent = (list.chance()*100).toFixed(2)+"%";
    });

    /** Empty Handler
     * 
     */
    list.addEventListener("emptied", (event)=>{
        event.stopPropagation();
        numLive.select();
    })

    lblChance.textContent = (list.chance()*100).toFixed(2)+"%";

    return [
        _("div", {id: "formWrapper"},
            form
        ),
        _("p", 
            "Live Change: ",
            lblChance
        ),
        list
    ]
}

/** App Load
 * 
 */
window.onload = () =>{
    const main = document.querySelector("main");
    if(main) {
        appendContent(
            main,
            buildApp()
        );
        document.querySelector<HTMLInputElement>("#numLive")?.select();
    } else {
        alert("Unable to find main!");
    }
    
}