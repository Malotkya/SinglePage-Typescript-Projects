/** /System/Iterator
 * 
 * @author Alex Malotky
 */

interface SystemIterator<T> {
    next(): SystemIteratorValue<T>
}

interface SystemIteratorValue<T> {
    value: [string, T],
    done?: boolean
}

type StructIterator<T> = MapIterator<[string, T]>|ArrayIterator<T>;

export default function SystemIterator<T>(...inputs:StructIterator<T>[]):SystemIterator<T> {
    let it:StructIterator<T>|undefined = inputs.shift();
    let i = 0;
    
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
            i = 0;
            return next();
        }

        //Map Iterator
        if(Array.isArray(value)) {
            return { value };
        }

        //Array Iterator
        return {
            value: [String(i++), value]
        }
    }

    return {next};
}