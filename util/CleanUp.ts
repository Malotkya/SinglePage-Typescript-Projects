/** CleanUp.ts
 * 
 * @author Alex Malotky
 */
export type CleanUp = ()=>void|Promise<void>;
export interface Destroyable {
    destroy:CleanUp
}


const list:Array<Destroyable|CleanUp> = [];

export function addToCleanup(item:Destroyable|CleanUp) {
    if(typeof item === "function" || (typeof item === "object" && typeof item.destroy === "function")) {
        list.push(item);
    } else {
        throw new Error("Item is not destroyable!");
    }
}

window.addEventListener("beforeunload", async(e)=>{
    for(const item of list){
        if(typeof item === "function")
            await item();
        else
            await item.destroy();
    }
});