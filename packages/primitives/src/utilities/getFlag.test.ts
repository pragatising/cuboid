import { test } from "node:test";
import assert from "node:assert/strict";
import { getFlag } from "./getFlag.ts";

test("returns null when the flag is absent", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "script.js"];
  try {
    assert.equal(getFlag("silent"), null);
  } finally {
    process.argv = originalArgv;
  }
});

test("returns the flag name when present with no value", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "script.js", "--silent"];
  try {
    assert.equal(getFlag("silent"), "--silent");
  } finally {
    process.argv = originalArgv;
  }
});

test("returns the value after '=' when present", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "script.js", "--theme=dark"];
  try {
    assert.equal(getFlag("theme"), "dark");
  } finally {
    process.argv = originalArgv;
  }
});

test("supports a custom prefix", () => {
  const originalArgv = process.argv;
  process.argv = ["node", "script.js", "-v"];
  try {
    assert.equal(getFlag("v", "-"), "-v");
  } finally {
    process.argv = originalArgv;
  }
});
