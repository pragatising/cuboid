import { test } from "node:test";
import assert from "node:assert/strict";
import { schemaErrorMessage } from "./schemaErrorMessage.ts";

test("formats a title with no description", () => {
  assert.equal(schemaErrorMessage("Invalid color"), "**Invalid color**");
});

test("formats a title with a description on its own line", () => {
  assert.equal(schemaErrorMessage("Invalid color", "Must be hex."), "**Invalid color**\nMust be hex.");
});
