import type { Platform } from "../../../behaviors";

/** `"ArrowUp"` -> `"Arrowup"`: the fallback display for a key with no special name. */
const capitalize = ([first = "", ...rest]: string) => first.toUpperCase() + rest.join("").toLowerCase();

const apple = (platform: Platform) => platform === "apple";

/**
 * Short, iconic key names (the condensed format): symbols on Apple platforms, where they are the convention, and words
 * elsewhere, where they are. Keys are lowercase, as `KeyboardEvent.key` names with `Mod` and `Plus` added.
 */
export const condensedKeyName = (key: string, platform: Platform): string =>
  ({
    alt: apple(platform) ? "⌥" : "Alt", // the Alt key is the Option key on macOS
    control: apple(platform) ? "⌃" : "Ctrl",
    shift: apple(platform) ? "⇧" : "Shift",
    meta: apple(platform) ? "⌘" : platform === "windows" ? "Win" : "Meta",
    mod: apple(platform) ? "⌘" : "Ctrl",
    pageup: "PgUp",
    pagedown: "PgDn",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    plus: "+", // so a chord can contain the plus key
    backspace: "⌫",
    delete: "Del",
    space: "␣", // so a sequence can contain the space key
    tab: "⇥",
    enter: "⏎",
    escape: "Esc",
    function: "Fn",
    capslock: "CapsLock",
    insert: "Ins",
    printscreen: "PrtScn",
  })[key] ?? capitalize(key);

/** The full format: key names as words, which read better in prose. */
export const fullKeyName = (key: string, platform: Platform): string =>
  ({
    alt: apple(platform) ? "Option" : "Alt",
    meta: apple(platform) ? "Command" : platform === "windows" ? "Windows" : "Meta",
    mod: apple(platform) ? "Command" : "Control",
    plus: "Plus",
    pageup: "Page Up",
    pagedown: "Page Down",
    arrowup: "Up Arrow",
    arrowdown: "Down Arrow",
    arrowleft: "Left Arrow",
    arrowright: "Right Arrow",
    capslock: "Caps Lock",
    printscreen: "Print Screen",
  })[key] ?? capitalize(key);

/**
 * What a screen reader should say for a key. Punctuation is spelled out, because a reader would otherwise pause or skip it
 * ("period", not "."); the names are the colloquial ones for the keys, not for the symbols ("dash", not "minus").
 */
export const accessibleKeyName = (key: string, platform: Platform): string =>
  ({
    alt: apple(platform) ? "option" : "alt",
    meta: apple(platform) ? "command" : platform === "windows" ? "Windows" : "meta",
    mod: apple(platform) ? "command" : "control",
    pageup: "page up",
    pagedown: "page down",
    arrowup: "up arrow",
    arrowdown: "down arrow",
    arrowleft: "left arrow",
    arrowright: "right arrow",
    capslock: "caps lock",
    printscreen: "print screen",
    "`": "backtick",
    "~": "tilde",
    "!": "exclamation point",
    "@": "at",
    "#": "hash",
    $: "dollar sign",
    "%": "percent",
    "^": "caret",
    "&": "ampersand",
    "*": "asterisk",
    "(": "left parenthesis",
    ")": "right parenthesis",
    _: "underscore",
    "-": "dash",
    "=": "equals",
    "[": "left bracket",
    "{": "left curly brace",
    "]": "right bracket",
    "}": "right curly brace",
    "\\": "backslash",
    "|": "pipe",
    ";": "semicolon",
    ":": "colon",
    "'": "single quote",
    '"': "double quote",
    ",": "comma",
    "<": "left angle bracket",
    ".": "period",
    ">": "right angle bracket",
    "/": "forward slash",
    "?": "question mark",
    plus: "plus",
    " ": "space",
    space: "space",
  })[key] ?? key.toLowerCase();
