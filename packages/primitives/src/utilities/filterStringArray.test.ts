import { test } from "node:test";
import assert from "node:assert/strict";
import { filterStringArray } from "./filterStringArray.ts";

test("splits on non-alphanumeric runs", () => {
  assert.deepEqual(filterStringArray(["button-bgColor"]), ["button", "bgColor"]);
});

test("joins multiple array entries before splitting", () => {
  assert.deepEqual(filterStringArray(["button", "bgColor"]), ["button", "bgColor"]);
});

test("drops falsy entries before joining", () => {
  assert.deepEqual(filterStringArray(["button", "", "bgColor"]), ["button", "bgColor"]);
});

test("collapses multiple separators into one split", () => {
  assert.deepEqual(filterStringArray(["a--__++b"]), ["a", "b"]);
});
