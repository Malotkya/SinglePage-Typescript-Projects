/** /Terminal/CleanUp
 * 
 * @author Alex Malotky
 */
export default interface Destroyable {
    destroy():void|Promise<void>
}

const list:Destroyable[] = [];

export function addToCleanup(item:Destroyable) {
    if(typeof item !== "object" || typeof item.destroy !== "function")
        throw new Error("Item is not destroyable!");
}

window.addEventListener("close", async()=>{
    for(const item of list){
        await item.destroy();
    }
});