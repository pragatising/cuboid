import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { PlatformProvider } from "../../../behaviors";
import type { Platform } from "../../../behaviors";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { KeybindingHint, getAccessibleKeybindingHintString } from "./KeybindingHint";
import type { KeybindingHintProps } from "./KeybindingHint";

behavesAsComponent({ Component: KeybindingHint, dataComponent: "KeybindingHint", props: { keys: "Mod+K" } });

const t = tokens.light.keybindingHint;
const hint = (props: Partial<KeybindingHintProps> & { platform?: Platform } = {}) => {
  const { platform = "apple", ...rest } = props;
  return render(
    <PlatformProvider value={platform}>
      <KeybindingHint keys="Mod+Shift+K" {...rest} />
    </PlatformProvider>,
  );
};
const root = (container: HTMLElement) => container.querySelector('[data-component="KeybindingHint"]') as HTMLElement;
const chords = (container: HTMLElement) => Array.from(container.querySelectorAll('[data-component="KeybindingHint.Chord"]')) as HTMLElement[];
/** What a screen reader says: the text with everything `aria-hidden` removed. */
const spoken = (el: HTMLElement) => {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[aria-hidden]").forEach((n) => n.remove());
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
};
/** What is shown: the aria-hidden glyphs, in order. */
const visible = (el: HTMLElement) => Array.from(el.querySelectorAll("[aria-hidden]")).map((n) => n.textContent?.trim()).filter(Boolean);

describe("KeybindingHint: what it shows and says", () => {
  it("is a kbd element", () => {
    const { container } = hint();
    expect(root(container).tagName).toBe("KBD");
  });

  it("shows modifiers first in the standard order, as Apple symbols on Apple platforms", () => {
    const { container } = hint({ platform: "apple" });
    expect(visible(chords(container)[0])).toEqual(["⌘", "⇧", "K"]);
  });

  it("shows words on other platforms", () => {
    const { container } = hint({ platform: "other" });
    expect(visible(chords(container)[0])).toEqual(["Ctrl", "Shift", "K"]);
  });

  it("a screen reader hears the key names, not the symbols", () => {
    const { container } = hint({ platform: "apple" });
    expect(spoken(chords(container)[0])).toBe("command shift k");
  });

  it("the full format spells keys out and separates them with a hidden plus", () => {
    const { container } = hint({ format: "full", platform: "apple" });
    expect(visible(chords(container)[0])).toEqual(["Command", "+", "Shift", "+", "K"]);
  });

  it("a sequence is a row of chords, with 'then' for a screen reader between them", () => {
    const { container } = hint({ keys: "g i", platform: "other" });
    expect(chords(container)).toHaveLength(2);
    expect(spoken(root(container))).toBe("g then i");
  });

  it("the accessible-string helper agrees with what is read", () => {
    expect(getAccessibleKeybindingHintString("Mod+Shift+K", "apple")).toBe("command shift k");
  });
});

describe("KeybindingHint: tokens", () => {
  it("normal takes its colours, border and size from the keybindingHint tokens", () => {
    const { container } = hint();
    const chord = chords(container)[0];
    expect(chord).toHaveStyle({ color: t.color.normal.fgColor });
    expect(chord.style.minWidth).toBe(t.sizes.md.minWidth);
    expect(chord.style.padding).toBe(t.sizes.md.padding);
    expect(chord.style.borderRadius).toBe(t.sizes.md.borderRadius);
    expect(chord.style.border).toContain("solid");
  });

  it("inverted and sm use their own tokens", () => {
    const { container } = hint({ variant: "inverted", size: "sm" });
    const chord = chords(container)[0];
    expect(chord).toHaveStyle({ color: t.color.inverted.fgColor, backgroundColor: t.color.inverted.bgColor });
    expect(chord.style.minWidth).toBe(t.sizes.sm.minWidth);
    expect(root(container)).toHaveAttribute("data-variant", "inverted");
    expect(root(container)).toHaveAttribute("data-size", "sm");
  });

  it("follows the mode", () => {
    const { container } = hint({ variant: "inverted" });
    act(() => setMode("dark"));
    expect(chords(container)[0]).toHaveStyle({ backgroundColor: tokens.dark.keybindingHint.color.inverted.bgColor });
  });

  it("merges the consumer's className and style onto the kbd", () => {
    const { container } = hint({ className: "mine", style: { opacity: 0.5 } });
    expect(root(container)).toHaveClass("mine");
    expect(root(container)).toHaveStyle({ opacity: "0.5" });
  });
});

describe("KeybindingHint: accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(
      <PlatformProvider value="apple">
        <p>
          Save with <KeybindingHint keys="Mod+S" /> or <KeybindingHint keys="g i" format="full" />
        </p>
      </PlatformProvider>,
    );
    await expectNoAxeViolations(container);
  });

  it("is read as one phrase in a sentence", () => {
    render(
      <PlatformProvider value="other">
        <p data-testid="p">Press <KeybindingHint keys="Mod+K" /> to search</p>
      </PlatformProvider>,
    );
    expect(spoken(screen.getByTestId("p"))).toBe("Press control k to search");
  });
});
