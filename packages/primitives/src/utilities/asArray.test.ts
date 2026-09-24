import { test } from "node:test";
import assert from "node:assert/strict";
import { asArray } from "./asArray.ts";

test("wraps a single value in an array", () => {
  assert.deepEqual(asArray("x"), ["x"]);
});

test("passes an existing array through unchanged", () => {
  assert.deepEqual(asArray(["a", "b"]), ["a", "b"]);
});

test("drops falsy entries", () => {
  assert.deepEqual(asArray(["a", "", "b", undefined as unknown as string]), ["a", "b"]);
});

test("wraps a falsy single value into an empty array", () => {
  assert.deepEqual(asArray(""), []);
});
