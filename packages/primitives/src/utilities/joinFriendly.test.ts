import { test } from "node:test";
import assert from "node:assert/strict";
import { joinFriendly } from "./joinFriendly.ts";

test("joins two items with the default 'and'", () => {
  assert.equal(joinFriendly(["a", "b"]), "a and b");
});

test("joins three or more items with commas and a final joiner", () => {
  assert.equal(joinFriendly(["a", "b", "c"]), "a, b and c");
});

test("supports a custom last-join word", () => {
  assert.equal(joinFriendly(["a", "b", "c"], "or"), "a, b or c");
});

test("returns the single item unchanged for a one-element array", () => {
  assert.equal(joinFriendly(["a"]), "a");
});

test("returns an empty string for an empty array", () => {
  assert.equal(joinFriendly([]), "");
});
