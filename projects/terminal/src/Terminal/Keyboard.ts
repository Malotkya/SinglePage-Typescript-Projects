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
    "NumLock", "NumbadDivide", "NumpadMultiply", "NumpadSubtract", "NumbpadAdd", "NumbpadEnter", "NumpadDecimal",
    "Numpad0", "Numpad1", "Numpad2", "Numpad3", "Numpad4", "Numpad5", "Numpad6", "Numpad7", "Numpad8", "Numpad9",
    "Pause"
] as const;
export type KeyCode = typeof KEY_CODES[number];

const KeysPressed:Record<string, boolean> = {};

function getKeyCode(event:KeyboardEvent):KeyCode {
    const code = event.code as KeyCode;
    if(!KEY_CODES.includes(code))
        console.warn(`Unkown key code: ${code}!`);
    return code;
}

export function reportKeyDown(event: KeyboardEvent):KeyCode {
    const code = getKeyCode(event);
    KeysPressed[code] = true;
    return code ;
}

export function reportKeyUp(event: KeyboardEvent):KeyCode {
    const code = getKeyCode(event);
    KeysPressed[code] = false;
    return code ;
}

export function isKeyPressed(code: KeyCode):boolean {
    return KeysPressed[code] === true;
}