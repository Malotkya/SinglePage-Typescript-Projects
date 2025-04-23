/** Stoarage.ts
 * 
 * @author Alex Malotky
 */

//Storage Callback
type StorageCallback = (s:string)=>void|Promise<void>;

//Listeners for each key.
const listeners:Record<string, StorageCallback[]> = {};

/** Add Stoarage Listener
 * 
 * @param {string} key 
 * @param {StorageCallback} callback 
 */
export function storageListener(key:string, callback:StorageCallback, imediate:boolean = true) {
    if(typeof key !== "string")
        throw new TypeError("Storage key must be a string!");
    if(typeof callback !== "function" || callback.length < 1)
        throw new TypeError("Stoargae Callback must ba function that accepts atleast one argument!");

    if(listeners[key]) {
        listeners[key].push(callback);
    } else {
        listeners[key] = [callback];
    }

    if(imediate)
        callback(localStorage.getItem(key) || "");
}

window.addEventListener("storage", (event:StorageEvent)=>{
    if(event.key && listeners[event.key]) {
        const value = event.newValue || "";
        for(const fun of listeners[event.key]){
            fun(value);
        }
    }
});

