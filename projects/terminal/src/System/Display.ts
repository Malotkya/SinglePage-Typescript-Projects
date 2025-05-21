import Dimensions from "./Kernel/Display/Dimension";
import Position from "./Kernel/Display/Position";
export type {Dimensions, Position};

export {comparePositions, normalizePositions} from "./Kernel/Display/Position";
export {initDisplay, put, print, scroll, cursor} from "./Kernel/Display";