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
export const KeyCode = {
    KEY_ERROR: 0,

    // ???: 1 - 9 
    BACK_SPACE: 8,
    TAB: 9,

    // ???: 10 - 12
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    // ???: 19 
    CAPS_LOCK: 20,

    // ???: 21 - 26
    ESCAPE: 27,

    // ???: 27 - 31
    SPACE_BAR: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,

    // ???: 41 - 34
    INSERT: 45,
    DELETE: 46,
    // ???: 47
    ZERO: 48,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    FIVE: 53,
    SIX: 54,
    SEVEN: 55,
    EIGHT: 56,
    NINE: 57,
    // ???: 58
    KEY_COLON: 59,
    // ???: 60
    KEY_EQUALS: 61,

    // ???: 62 - 64
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,

    // ???: 91 - 95
    PAD_ZERO: 96,
    PAD_ONE: 97,
    PAD_TWO: 98,
    PAD_THREE: 99,
    PAD_FOUR: 100,
    PAD_FIVE: 101,
    PAD_SIX: 102,
    PAD_SEVEN: 103,
    PAD_EIGHT: 104,
    PAD_NINE: 105,
    PAD_TIMES: 106,
    PAD_PLUS: 107,
    // ???: 108
    PAD_MINUS: 109,
    // ???: 110
    PAD_DEVIDE: 111,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,

    // ???: 124 - 143
    NUM_LOCK: 144,

    // ???: 145 - 172
    DASH: 173,
    COMMA: 188,
    PERIOD: 190,
    FORWARD_SLASH: 191,
    TICK: 192,

    // ???: 192 - 218
    OPEN_BRACKET: 219,
    BACK_SLASH: 220,
    CLOSE_BRACKET: 221,
    PARENTHESES: 222,
} as const;
export type KeyCodeType = (typeof KeyCode)[keyof typeof KeyCode];

let keyPressed: number = 0;

export function getKeyPressed(code: KeyCodeType):string {
    return String.fromCharCode(code);
}

export function reportKeyDown(event: KeyboardEvent):KeyCodeType {
    const code = event.key.charCodeAt(1) as KeyCodeType;
    keyPressed |= (1 << code);
    return code ;
}

export function reportKeyUp(event: KeyboardEvent):KeyCodeType {
    const code = event.key.charCodeAt(1) as KeyCodeType;
    keyPressed &= ~(1 << code);
    return code ;
}

export function isKeyPressed(code: KeyCodeType):boolean {
    return (keyPressed & (1 << code)) === 1
}