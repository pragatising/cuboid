import { describe, expect, it } from "vitest";
import { accessibleKeyName, condensedKeyName, fullKeyName } from "./keyNames";
import { accessibleKeybindingString, splitChord, splitSequence } from "./parse";

describe("splitChord", () => {
  it("lowercases the keys", () => expect(splitChord("Control+K")).toEqual(["control", "k"]));

  it("puts modifiers first in the standard order, whatever order they were written", () => {
    expect(splitChord("K+Shift+Alt+Control")).toEqual(["control", "alt", "shift", "k"]);
    expect(splitChord("Shift+Mod+K")).toEqual(["mod", "shift", "k"]);
    expect(splitChord("Alt+Meta")).toEqual(["meta", "alt"]);
  });

  it("keeps a plain key as it is, and the plus key as the word Plus", () => {
    expect(splitChord("Mod+Plus")).toEqual(["mod", "plus"]);
    expect(splitChord("a")).toEqual(["a"]);
  });
});

describe("splitSequence", () => {
  it("splits chords on spaces, tolerating extra whitespace", () => {
    expect(splitSequence("g i")).toEqual(["g", "i"]);
    expect(splitSequence("  Mod+K   Mod+S ")).toEqual(["Mod+K", "Mod+S"]);
  });
});

describe("key names", () => {
  it("condensed: symbols on Apple, words elsewhere", () => {
    expect(condensedKeyName("mod", "apple")).toBe("⌘");
    expect(condensedKeyName("mod", "other")).toBe("Ctrl");
    expect(condensedKeyName("shift", "apple")).toBe("⇧");
    expect(condensedKeyName("shift", "windows")).toBe("Shift");
    expect(condensedKeyName("alt", "apple")).toBe("⌥");
    expect(condensedKeyName("meta", "windows")).toBe("Win");
    expect(condensedKeyName("meta", "other")).toBe("Meta");
    expect(condensedKeyName("arrowup", "other")).toBe("↑");
    expect(condensedKeyName("enter", "other")).toBe("⏎");
    expect(condensedKeyName("k", "apple")).toBe("K");
  });

  it("full: words", () => {
    expect(fullKeyName("mod", "apple")).toBe("Command");
    expect(fullKeyName("mod", "other")).toBe("Control");
    expect(fullKeyName("alt", "apple")).toBe("Option");
    expect(fullKeyName("arrowleft", "other")).toBe("Left Arrow");
    expect(fullKeyName("plus", "other")).toBe("Plus");
    expect(fullKeyName("escape", "other")).toBe("Escape");
  });

  it("accessible: colloquial names, punctuation spelled out", () => {
    expect(accessibleKeyName("mod", "apple")).toBe("command");
    expect(accessibleKeyName("mod", "windows")).toBe("control");
    expect(accessibleKeyName(".", "other")).toBe("period");
    expect(accessibleKeyName("-", "other")).toBe("dash");
    expect(accessibleKeyName("pagedown", "other")).toBe("page down");
    expect(accessibleKeyName("K", "other")).toBe("k");
  });
});

describe("accessibleKeybindingString", () => {
  it("reads a chord as its keys in order, and a sequence joined by 'then'", () => {
    expect(accessibleKeybindingString("Shift+Mod+K", "apple")).toBe("command shift k");
    expect(accessibleKeybindingString("Shift+Mod+K", "other")).toBe("control shift k");
    expect(accessibleKeybindingString("g i", "other")).toBe("g then i");
    expect(accessibleKeybindingString("Mod+K Mod+S", "apple")).toBe("command k then command s");
  });
});
