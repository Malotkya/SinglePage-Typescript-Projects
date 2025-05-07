/** /System/Iterator
 * 
 * @author Alex Malotky
 */

//System Iterator
interface SystemIterator<T> {
    next(): SystemIteratorValue<T>
}

//System Iterator Value
interface SystemIteratorValue<T> {
    value: [string, T],
    done?: boolean
}

type StructIterator<T> = MapIterator<[string, T]>;

/** System Iterator Constructor
 * 
 * @param {StructIterator[]} inputs 
 * @returns {SystemIterator}
 */
export default function SystemIterator<T>(...inputs:StructIterator<T>[]):SystemIterator<T> {
    let it:StructIterator<T>|undefined = inputs.shift();
    
    const next = ():SystemIteratorValue<T> => {
        //Stop if Done
        if(it === undefined) {
            return {
                value: <any>null,
                done: true
            }
        }

        //Get Next Value
        const {done, value} = it!.next();

        //Reset to next iterator
        if(done){
            it = inputs.shift();
            return next();
        }

        return { value };
    }

    return {next};
}