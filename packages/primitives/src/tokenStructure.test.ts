import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import JSON5 from "json5";

/**
 * A DTCG token (an object with `$value`) is a LEAF. If it also has child tokens, Style
 * Dictionary silently drops the children: the output has the leaf's value and nothing
 * else, and the build still exits 0. This hid `subtitle.fgColor` and all of
 * `inlineCodeSnippet`'s colour/padding/radius tokens. Plain sibling values such as
 * `alpha: 0.2` are fine; only nested objects are children.
 */

const TOKENS = path.join(path.dirname(fileURLToPath(import.meta.url)), "tokens");

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function json5Files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? json5Files(p) : e.name.endsWith(".json5") ? [p] : [];
  });
}

function leavesWithChildren(node: unknown, at: string[] = []): string[] {
  if (!isObject(node)) return [];
  const children = Object.entries(node).filter(([k, v]) => !k.startsWith("$") && isObject(v));
  const here = "$value" in node && children.length > 0 ? [`${at.join(".")} has child tokens: ${children.map(([k]) => k).join(", ")}`] : [];
  return [...here, ...children.flatMap(([k, v]) => leavesWithChildren(v, [...at, k]))];
}

describe("token source structure", () => {
  it("no token with a $value also has child tokens (Style Dictionary would drop them silently)", () => {
    const violations = json5Files(TOKENS).flatMap((file) =>
      leavesWithChildren(JSON5.parse(fs.readFileSync(file, "utf8"))).map((v) => `${path.relative(TOKENS, file)}: ${v}`),
    );
    assert.deepEqual(violations, []);
  });
});
