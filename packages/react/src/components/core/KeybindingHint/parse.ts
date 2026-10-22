import type { Platform } from "../../../behaviors";
import { accessibleKeyName } from "./keyNames";

/** The order modifiers are shown in, whatever order they were written: Ctrl/Command, then Meta, Alt, Shift, then the key. */
const MODIFIER_ORDER: Partial<Record<string, number>> = { control: 1, mod: 1, meta: 2, alt: 3, option: 3, shift: 4, function: 5 };

const order = (key: string) => MODIFIER_ORDER[key] ?? Infinity;

/** `"Shift+Mod+K"` -> `["mod", "shift", "k"]`: lowercase, modifiers first in the standard order. */
export function splitChord(chord: string): string[] {
  // `Plus` is the plus key, so `+` can separate the keys of a chord; `Space` likewise for a sequence.
  return chord
    .split("+")
    .map((key) => key.toLowerCase())
    .sort((a, b) => order(a) - order(b));
}

/** `"g i"` -> `["g", "i"]`: the chords to press one after the other. */
export const splitSequence = (sequence: string): string[] => sequence.trim().split(/\s+/);

/**
 * A plain-string reading of a shortcut for an `aria-label` or description ("command shift k", "g then i"). Never render it
 * visibly; pair it with a visible hint.
 */
export function accessibleKeybindingString(keys: string, platform: Platform): string {
  return splitSequence(keys)
    .map((chord) => splitChord(chord).map((key) => accessibleKeyName(key, platform)).join(" "))
    .join(" then ");
}
