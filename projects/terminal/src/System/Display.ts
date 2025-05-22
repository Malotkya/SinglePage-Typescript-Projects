/** /System/Display
 * 
 */
import DisplayContext, {DisplayInitInfo, BaseDisplayInterface, FONT_RATIO, Y_OFFSET, INTERFACE_OFFSET, HighlightMap} from "./Kernel/Display/Context";
import Dimensions from "./Kernel/Display/Dimension";
import Position from "./Kernel/Display/Position";
export type {Dimensions, Position, DisplayContext, DisplayInitInfo, BaseDisplayInterface, HighlightMap};
export {FONT_RATIO, Y_OFFSET, INTERFACE_OFFSET};

export {comparePositions, normalizePositions} from "./Kernel/Display/Position";
export {initDisplay, releaseDisplay, put, print, scroll, cursor, HIGHLIGHT_OFFSET, viewTemplate} from "./Kernel/Display";