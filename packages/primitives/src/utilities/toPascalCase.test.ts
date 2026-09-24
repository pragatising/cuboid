import { test } from "node:test";
import assert from "node:assert/strict";
import { toPascalCase } from "./toPascalCase.ts";

test("converts a path-segment array to PascalCase", () => {
  assert.equal(toPascalCase(["button", "bgColor"]), "ButtonBgColor");
});

test("converts a kebab-case string to PascalCase", () => {
  assert.equal(toPascalCase("bg-color"), "BgColor");
});

test("uppercases a single word", () => {
  assert.equal(toPascalCase("button"), "Button");
});
