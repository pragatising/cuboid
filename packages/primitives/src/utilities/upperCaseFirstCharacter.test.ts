import { test } from "node:test";
import assert from "node:assert/strict";
import { upperCaseFirstCharacter } from "./upperCaseFirstCharacter.ts";

test("uppercases only the first character", () => {
  assert.equal(upperCaseFirstCharacter("bgColor"), "BgColor");
});

test("leaves an already-uppercase first character unchanged", () => {
  assert.equal(upperCaseFirstCharacter("Button"), "Button");
});

test("handles a single-character string", () => {
  assert.equal(upperCaseFirstCharacter("a"), "A");
});
