import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { cssVars } from "./cssVars";
import { transitionCss } from "./motion";

describe("cssVars", () => {
  it("names variables --<component>-<property>-<state>", () => {
    expect(cssVars("button", { bg: { rest: "#fff", hover: "#eee" }, fg: { rest: "#000" } })).toEqual({
      "--button-bg-rest": "#fff",
      "--button-bg-hover": "#eee",
      "--button-fg-rest": "#000",
    });
  });

  it("kebab-cases camelCase keys and joins any nesting depth", () => {
    expect(cssVars("iconButton", { borderColor: { rest: "a" }, focus: { ring: { color: "b" } } })).toEqual({
      "--icon-button-border-color-rest": "a",
      "--icon-button-focus-ring-color": "b",
    });
  });

  it("accepts top-level values with no state", () => {
    expect(cssVars("button", { iconSize: "1rem" })).toEqual({ "--button-icon-size": "1rem" });
  });
});

describe("transitionCss", () => {
  it("builds a transition for each property from a motion token", () => {
    expect(transitionCss(tokens.light.motion.transition.hover, ["color", "background-color"])).toBe(
      "color 100ms cubic-bezier(0.25, 0.1, 0.25, 1), background-color 100ms cubic-bezier(0.25, 0.1, 0.25, 1)",
    );
  });
});
