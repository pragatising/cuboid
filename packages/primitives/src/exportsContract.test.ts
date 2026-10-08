import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Asserts package.json's `exports` map points at files the real build
 * actually produces — the public npm consumption contract for ADR-04
 * (docs/adr/adr-04-token-consumption-shape.md). Run after `tokens:theme`
 * has produced dist/ (the pipeline's own tests already cover the
 * platform logic in isolation; this covers the subpath-to-file wiring a
 * consumer actually imports against).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const packageJson = (await import(path.join(ROOT, "package.json"), { with: { type: "json" } })).default as {
  exports: Record<string, string>;
};

async function exists(relativePath: string) {
  try {
    await access(path.join(ROOT, relativePath));
    return true;
  } catch {
    return false;
  }
}

describe("package.json exports map resolves to real build output", () => {
  it("every static (non-glob) export subpath points at a file the build actually produces", async () => {
    const missing: string[] = [];
    for (const [subpath, target] of Object.entries(packageJson.exports)) {
      if (target.includes("*")) continue; // glob subpaths (./css/*) have no single file to check
      if (!(await exists(target))) missing.push(`${subpath} -> ${target}`);
    }
    assert.deepEqual(missing, [], "run `npm run tokens:theme` before this test if dist/ is stale or missing");
  });

  it("declares the ESM token module subpath used by ADR-04 consumers", () => {
    assert.equal(packageJson.exports["./tokens.js"], "./dist/js/tokens.js");
  });

  it("declares the applyOverrides subpath, shipped directly from src/ (no compile step exists for hand-written runtime utilities in this package)", () => {
    assert.equal(packageJson.exports["./applyOverrides"], "./src/applyOverrides.ts");
  });
});
