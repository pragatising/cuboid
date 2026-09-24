import { test } from "node:test";
import assert from "node:assert/strict";
import { toCamelCase } from "./toCamelCase.ts";

test("converts a path-segment array to camelCase", () => {
  assert.equal(toCamelCase(["button", "bgColor"]), "buttonBgColor");
});

test("converts a kebab-case string to camelCase", () => {
  assert.equal(toCamelCase("bg-color"), "bgColor");
});

test("keeps a single word lowercase", () => {
  assert.equal(toCamelCase("button"), "button");
});

test("does not double-uppercase an already-camelCase segment", () => {
  assert.equal(toCamelCase(["button", "bgColor"]), "buttonBgColor");
});
