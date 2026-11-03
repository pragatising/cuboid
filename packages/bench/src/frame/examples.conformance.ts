import { describe, expect, it } from "vitest";
import { examplesIn, hasExamples, humanize, loadExamples } from "./examples";

describe("humanize", () => {
  it.each([
    ["Default", "Default"],
    ["SignInNeeded", "Sign in needed"],
    ["OwnClient", "Own client"],
    ["WithURLField", "With url field"],
    ["Ratio16x9", "Ratio16x9"],
  ])("%s is %s", (name, words) => expect(humanize(name)).toBe(words));
});

describe("finding a component's examples file", () => {
  const files = {
    "~bench/0/src/components/core/Select/Select.examples.tsx": async () => ({ Default: () => null }),
    "~bench/0/src/components/core/Selectable/Selectable.examples.tsx": async () => ({}),
  };

  it("is by the component's name, wherever in the package the file is", () => {
    expect(hasExamples("Select", files)).toBe(true);
  });

  it("does not take another component whose name starts with it, and is false with no file", () => {
    expect(hasExamples("Sel", files)).toBe(false);
    expect(hasExamples("Button", files)).toBe(false);
  });

  it("is undefined to load for a component with no file", async () => {
    expect(await loadExamples("Button", files, {})).toBeUndefined();
  });
});

describe("examplesIn", () => {
  const A = () => null;
  const B = () => null;
  const C = () => null;

  it("is each export that is a function, and nothing else", () => {
    expect(examplesIn({ A, FIXTURE: "https://x", count: 3 }).map((example) => example.name)).toEqual(["A"]);
  });

  it("carries the frame an example was given, and an empty one for an example with none", () => {
    const Mobile = Object.assign(() => null, { frame: { name: "On a phone", device: "phone" as const } });
    expect(examplesIn({ A, Mobile }).map((example) => example.frame)).toEqual([{}, { name: "On a phone", device: "phone" }]);
  });

  it("is in the order the file writes them, not the order the module lists them (sorted by name)", () => {
    const source = "export const C = () => null;\nexport async function B() {}\nexport function A() {}";
    expect(examplesIn({ A, B, C }, source).map((example) => example.name)).toEqual(["C", "B", "A"]);
  });

  it("puts an export the source does not show (a re-export) last", () => {
    expect(examplesIn({ A, B }, "export function B() {}").map((example) => example.name)).toEqual(["B", "A"]);
  });
});

// The real library, through the build: the globs in `virtual:bench` find the files the library has.
describe("the library's examples files", () => {
  it("are found by component name and load in the order they are written", async () => {
    const names = (await loadExamples("SmartCard"))?.map((example) => example.name) ?? [];
    expect(names[0]).toBe("Default");
    // Written `Ratio` before `OwnClient`, the reverse of the alphabet.
    expect(names.indexOf("Ratio")).toBeGreaterThan(-1);
    expect(names.indexOf("Ratio")).toBeLessThan(names.indexOf("OwnClient"));
  });
});
