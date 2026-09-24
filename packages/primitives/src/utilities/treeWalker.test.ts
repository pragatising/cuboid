import { test } from "node:test";
import assert from "node:assert/strict";
import { treeWalker } from "./treeWalker.ts";

const isTokenLeaf = (item: unknown): boolean =>
  typeof item === "object" && item !== null && "$value" in (item as Record<string, unknown>);

test("visits every leaf matching the predicate and applies the callback", () => {
  const tree = {
    button: {
      primary: { $value: "#000", $type: "color" },
      secondary: { $value: "#fff", $type: "color" },
    },
  };

  const result = treeWalker(tree, (leaf) => (leaf as { $value: string }).$value.toUpperCase(), isTokenLeaf);

  assert.deepEqual(result, {
    button: { primary: "#000", secondary: "#FFF" },
  });
});

test("does not recurse into a matched leaf's own children", () => {
  const tree = { color: { $value: { nested: "should not be walked" }, $type: "color" } };

  const result = treeWalker(tree, () => "REPLACED", isTokenLeaf);

  assert.deepEqual(result, { color: "REPLACED" });
});

test("passes non-object values through unchanged", () => {
  assert.equal(treeWalker("plain string", () => "x", isTokenLeaf), "plain string");
  assert.equal(treeWalker(42, () => "x", isTokenLeaf), 42);
  assert.equal(treeWalker(null, () => "x", isTokenLeaf), null);
});

test("walks an empty object to an empty object", () => {
  assert.deepEqual(treeWalker({}, () => "x", isTokenLeaf), {});
});
