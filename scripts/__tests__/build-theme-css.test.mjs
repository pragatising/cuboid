import test from "node:test";
import assert from "node:assert/strict";
import { compareCssVarNames, sortCssVarEntries } from "../build-theme-css.mjs";

test("space CSS custom properties are sorted by numeric size", () => {
  const vars = new Map([
    ["--cube-space-10px", "0.625rem"],
    ["--cube-space-2px", "0.125rem"],
    ["--cube-space-1px", "0.0625rem"],
    ["--cube-space-12px", "0.75rem"],
  ]);

  const sorted = sortCssVarEntries(vars).map(([name]) => name);

  assert.deepEqual(sorted, [
    "--cube-space-1px",
    "--cube-space-2px",
    "--cube-space-10px",
    "--cube-space-12px",
  ]);
});

test("non-space CSS custom properties keep lexical ordering", () => {
  const vars = new Map([
    ["--cube-color-accent", "#ff0"],
    ["--cube-color-base", "#000"],
  ]);

  const sorted = sortCssVarEntries(vars).map(([name]) => name);

  assert.deepEqual(sorted, ["--cube-color-accent", "--cube-color-base"]);
});

test("compareCssVarNames treats space vars numerically", () => {
  assert.equal(compareCssVarNames("--cube-space-2px", "--cube-space-10px"), -8);
  assert.equal(compareCssVarNames("--cube-space-10px", "--cube-space-2px"), 8);
});
