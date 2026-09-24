import { test } from "node:test";
import assert from "node:assert/strict";
import { lowerCaseFirstCharacter } from "./lowerCaseFirstCharacter.ts";

test("lowercases only the first character", () => {
  assert.equal(lowerCaseFirstCharacter("BgColor"), "bgColor");
});

test("leaves an already-lowercase first character unchanged", () => {
  assert.equal(lowerCaseFirstCharacter("button"), "button");
});

test("handles a single-character string", () => {
  assert.equal(lowerCaseFirstCharacter("A"), "a");
});
