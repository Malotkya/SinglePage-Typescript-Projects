/** CleanUp.ts
 * 
 * @author Alex Malotky
 */
export interface Destroyable {
    destroy():void|Promise<void>
}

const list:Destroyable[] = [];

export function addToCleanup(item:Destroyable) {
    if(typeof item !== "object" || typeof item.destroy !== "function")
        throw new Error("Item is not destroyable!");
    list.push(item);
}

window.addEventListener("beforeunload", async(e)=>{
    for(const item of list){
        await item.destroy();
    }
});