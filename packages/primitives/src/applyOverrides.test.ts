import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyOverrides } from "./applyOverrides.ts";

describe("applyOverrides", () => {
  it("overrides a top-level leaf, leaving unrelated siblings untouched", () => {
    const base = { card: { bgColor: "#fafafa", borderRadius: "0.5rem" } };
    const result = applyOverrides(base, { card: { bgColor: "#1a1a1a" } });

    assert.equal(result.card.bgColor, "#1a1a1a");
    assert.equal(result.card.borderRadius, "0.5rem");
  });

  it("overrides a deeply nested leaf, leaving the rest of the tree untouched", () => {
    const base = {
      button: {
        primary: { bgColor: "#1a7f37", fgColor: "#ffffff" },
        danger: { bgColor: "#cf222e", fgColor: "#ffffff" },
      },
    };
    const result = applyOverrides(base, { button: { danger: { bgColor: "#ff4444" } } });

    assert.equal(result.button.danger.bgColor, "#ff4444");
    assert.equal(result.button.danger.fgColor, "#ffffff");
    assert.deepEqual(result.button.primary, base.button.primary);
  });

  it("does not mutate the base object", () => {
    const base = { card: { bgColor: "#fafafa" } };
    const baseSnapshot = JSON.parse(JSON.stringify(base));

    applyOverrides(base, { card: { bgColor: "#1a1a1a" } });

    assert.deepEqual(base, baseSnapshot);
  });

  it("an override for a key that doesn't exist on base is added, not rejected", () => {
    const base = { card: { bgColor: "#fafafa" } };
    const result = applyOverrides(base, { card: { borderColor: "#eaeaea" } }) as typeof base & { card: { borderColor: string } };

    assert.equal(result.card.borderColor, "#eaeaea");
    assert.equal(result.card.bgColor, "#fafafa");
  });

  it("an empty override object returns an equivalent, but shallow-copied, tree", () => {
    const base = { card: { bgColor: "#fafafa" } };
    const result = applyOverrides(base, {});

    assert.deepEqual(result, base);
    assert.notEqual(result, base);
  });

  it("replaces an array wholesale rather than merging by index", () => {
    // A shadow token's $value is an array of layer objects — index-merging
    // would silently mix one override's color with another's offset.
    const base = {
      shadow: {
        card: [
          { offsetX: "0rem", offsetY: "0.0625rem", blur: "0.125rem", color: "#00000010" },
          { offsetX: "0rem", offsetY: "0.25rem", blur: "0.5rem", color: "#00000020" },
        ],
      },
    };
    const newLayers = [{ offsetX: "0rem", offsetY: "0.5rem", blur: "1rem", color: "#00000040" }];
    const result = applyOverrides(base, { shadow: { card: newLayers } });

    assert.deepEqual(result.shadow.card, newLayers);
    assert.equal(result.shadow.card.length, 1);
  });

  it("replaces a plain-string leaf with an array override, and vice versa, without merging", () => {
    const base = { fontStack: { system: "Inter, sans-serif" } };
    const asArray = applyOverrides(base, { fontStack: { system: ["Custom Font", "sans-serif"] } });
    assert.deepEqual(asArray.fontStack.system, ["Custom Font", "sans-serif"]);

    const base2 = { fontStack: { system: ["Inter", "sans-serif"] } };
    const asString = applyOverrides(base2, { fontStack: { system: "Custom Font, sans-serif" } });
    assert.equal(asString.fontStack.system, "Custom Font, sans-serif");
  });

  it("overriding an object with a primitive replaces the whole subtree", () => {
    const base = { button: { primary: { bgColor: "#1a7f37", fgColor: "#ffffff" } } };
    const result = applyOverrides(base, { button: { primary: "inherit" } }) as unknown as { button: { primary: string } };

    assert.equal(result.button.primary, "inherit");
  });

  it("supports a full-theme override that touches every key, not just a subset", () => {
    const base = {
      bgColor: { light: "#ffffff", dark: "#000000" },
      fgColor: { light: "#000000", dark: "#ffffff" },
    };
    const fullOverride = {
      bgColor: { light: "#f8f8f6", dark: "#111111" },
      fgColor: { light: "#111111", dark: "#f8f8f6" },
    };
    const result = applyOverrides(base, fullOverride);

    assert.deepEqual(result, fullOverride);
  });
});
