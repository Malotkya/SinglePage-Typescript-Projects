/** /Terminal/Keyboard
 * 
 * This file contains all the constants that represent keyboard keys.  It also
 * contains the functions to get the keycode from the even/browser and to check
 *  if the key is currently being pressed.
 * 
 * @author: Alex Malotky
 */

/** Known Key Codes
 * 
 */
const KEY_CODES = [
    "Escape", "Backquote", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Delete",
    "Backquote", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "Backspace",
    "Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Backslash",
    "CapsLock", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "Enter", 
    "ShiftLeft", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "ShiftRight",
    "ControlLeft", "AltLeft", "Space", "AltRight", "ControlRight",
    "ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight", "Home", "End", "PageUp", "PageDown",
    "NumLock", "NumpadDivide", "NumpadMultiply", "NumpadSubtract", "NumpadAdd", "NumbpadEnter", "NumpadDecimal",
    "Numpad0", "Numpad1", "Numpad2", "Numpad3", "Numpad4", "Numpad5", "Numpad6", "Numpad7", "Numpad8", "Numpad9", "NumpadEnter",
    "Pause"
] as const;
export type KeyCode = typeof KEY_CODES[number];

/** Get Key Code & Stored Index
 * 
 * @param {KeyboardEvent} event 
 * @returns {[KeyCode, number]}
 */
function getKeyCode(event:KeyboardEvent):[code:KeyCode, index:number, alt:KeyCode|undefined, altIndex:number|undefined] {
    const code = event.ctrlKey
        ? "ControlLeft"
        : event.altKey
            ? "AltLeft"
            : event.shiftKey
                ? "ShiftLeft"
                : event.code as KeyCode;

    const index  = KEY_CODES.indexOf(code);
    const alt     = code !== event.code?  event.code as KeyCode: undefined;
    const altIndex = alt? KEY_CODES.indexOf(alt): undefined;

    if(index < 0)
        console.warn(`Unkown key code: ${code}!`);

    return [code, index, alt, altIndex];
}

let KeysPressed:number = 0;

/** Report Key Down
         * 
         * @param {KeyboardEvent} event 
         * @returns {KeyCode}
         */
export function reportKeyDown(event: KeyboardEvent):KeyboardData {
    const [key, index, alt, altIndex] = getKeyCode(event);
    KeysPressed |= (1 << index);
    if(altIndex !== undefined && altIndex >= 0)
        KeysPressed |= (1 << altIndex);
    return {
        value: event.key,
        key, alt
    };
}

/** Report Key Up
 * 
 * @param {KeyboardEvent} event 
 * @returns {KeyCode}
 */
export function reportKeyUp(event: KeyboardEvent):KeyboardData {
    const [key, index, alt, altIndex] = getKeyCode(event);
    KeysPressed &= ~(1 << index);
    if(altIndex !== undefined && altIndex >= 0)
        KeysPressed &= ~(1 << altIndex);
    return {
        value: event.key,
        key, alt
    };
}

/** Is Key Pressed
 * 
 * @param {KeyboardEvent} code 
 * @returns {KeyCode}
 */
export function isKeyPressed(code: KeyCode):boolean {
    const index = KEY_CODES.indexOf(code);
    if(index < 0) {
        console.warn(`Unkown key code: ${code}!`);
        return false;
    }

    return (KeysPressed & (1 << index)) !== 0;
}

export interface KeyboardData {
    key: KeyCode
    alt?: KeyCode
    value: string
}

export interface KeyboardType {
    isKeyPressed(code:KeyCode):boolean
}