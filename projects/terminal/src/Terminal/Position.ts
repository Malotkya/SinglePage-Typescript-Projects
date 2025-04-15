/** /Terminal/Position
 * 
 * @author Alex Malotky
 */

//Coordinates on screen
export default interface Position {
    x: number,
    y: number
}

//Size of screen
export interface Dimensions {
    width: number,
    height: number
}

/** Compare Positions
 * 
 * @param {Position} lhs 
 * @param {Position} rhs 
 * @returns {number}
 */
export function comparePositions(lhs:Position, rhs:Position):number {
    const test = lhs.y - rhs.y;
    if(test !== 0)
        return test;

    return lhs.x - rhs.x;
}

/** Normalize Position
 * 
 * @param {[Position, Position]|null} map 
 * @param {Position} max 
 * @returns {[Position, Position]|null}
 */
export function normalizePositions(map:[Position, Position]|null, max:Position):[Position, Position]|null {
    if(map === null)
        return map;

    //Quit if same position
    const compare = comparePositions(...map)
    if( compare === 0)
        return null;

    const lhs = comparePositions(map[0], max);
    const rhs = comparePositions(map[1], max);
    //Quit if both are out of bounds
    if(lhs > 0 && rhs > 0) {
        return null;

    //First Position out of bounds
    } else if(lhs > 0) {
        return [map[1], max];

    //Second Position out of bounds
    } else if(rhs > 0) {
        return [map[0], max];

    //Both are in bounds and out of order
    } else if(compare > 0){
        return [map[1], map[0]]
    }

    //Already in proper order.
    return map;
}