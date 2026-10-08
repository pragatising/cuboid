import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { styleDictionary } from "../styleDictionary.ts";
import { javascript } from "./javascript.ts";
import { typescript } from "./typescript.ts";

/**
 * End-to-end regression test for the javascript/typescript platforms
 * (ADR-04: docs/adr/adr-04-token-consumption-shape.md — the real
 * consumer seam, a statically-imported resolved-values object).
 *
 * Runs a REAL buildAllPlatforms() against cuboid's real token tree, into
 * a throwaway temp directory, then reads the emitted files back — not a
 * mock. Style Dictionary does not fail the build on a transform error by
 * default (it logs and substitutes the untransformed value, still exits
 * 0 — see primitives-pipeline-tracker.md's "one thing to understand
 * about this pipeline"), so only reading real emitted values, not a
 * green exit, catches a regression here.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");

async function buildToTempDir() {
  const outDir = await mkdtemp(path.join(tmpdir(), "cuboid-js-output-test-"));

  const extendedSD = await styleDictionary.extend({
    include: [path.join(ROOT, "src", "tokens", "base", "**", "*.json5")],
    source: [path.join(ROOT, "src", "tokens", "functional", "**", "*.json5"), path.join(ROOT, "src", "tokens", "components", "**", "*.json5")],
    log: { verbosity: "silent", warnings: "error", errors: { brokenReferences: "throw" } },
    platforms: {
      typescript: typescript("tokens.js", undefined, `${outDir}/js/`),
      javascript: javascript("tokens.js", undefined, `${outDir}/cjs/`),
    },
  });

  await extendedSD.buildAllPlatforms();
  return outDir;
}

describe("javascript/typescript platforms emit resolved, consumable token modules", () => {
  it("builds without throwing", async () => {
    const outDir = await buildToTempDir();
    await rm(outDir, { recursive: true, force: true });
  });

  it("ESM output is real `export default {...}` with resolved, non-empty values", async () => {
    const outDir = await buildToTempDir();
    try {
      const esm = await readFile(path.join(outDir, "js", "tokens.js"), "utf8");
      assert.match(esm, /^export default\s*\{/);
      // No un-resolved {reference} left over, no failed-transform markers.
      assert.doesNotMatch(esm, /undefined/);
      assert.doesNotMatch(esm, /\[object Object\]/);
      assert.doesNotMatch(esm, /"\{[a-zA-Z0-9.]+\}"/, "a literal '{path.to.token}' string means a reference failed to resolve");
      // Spot-check one real, known-stable leaf rather than the whole tree.
      assert.match(esm, /borderRadius:\s*\{[\s\S]*?full:\s*"624\.9375rem"/);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("CommonJS output is real `module.exports = {...}` with resolved, non-empty values", async () => {
    const outDir = await buildToTempDir();
    try {
      const cjs = await readFile(path.join(outDir, "cjs", "tokens.js"), "utf8");
      assert.match(cjs, /^module\.exports\s*=\s*\{/);
      assert.doesNotMatch(cjs, /undefined/);
      assert.doesNotMatch(cjs, /\[object Object\]/);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("ESM and CommonJS outputs resolve to the identical value tree", async () => {
    const outDir = await buildToTempDir();
    try {
      const esmSource = await readFile(path.join(outDir, "js", "tokens.js"), "utf8");
      const cjsSource = await readFile(path.join(outDir, "cjs", "tokens.js"), "utf8");

      const esmModulePath = path.join(outDir, "js", "tokens.mjs");
      await import("node:fs/promises").then((fs) => fs.writeFile(esmModulePath, esmSource));
      const esmTokens = (await import(esmModulePath)).default;

      const cjsModulePath = path.join(outDir, "cjs", "tokens.cjs");
      await import("node:fs/promises").then((fs) => fs.writeFile(cjsModulePath, cjsSource));
      const cjsTokens = (await import(cjsModulePath)).default;

      assert.deepEqual(esmTokens, cjsTokens);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("every leaf value is a resolved string or number, never an object placeholder or empty string", async () => {
    const outDir = await buildToTempDir();
    try {
      const esmSource = await readFile(path.join(outDir, "js", "tokens.js"), "utf8");
      const modulePath = path.join(outDir, "js", "tokens.mjs");
      await import("node:fs/promises").then((fs) => fs.writeFile(modulePath, esmSource));
      const tokens = (await import(modulePath)).default;

      const badLeaves: string[] = [];
      function walk(node: unknown, pathSoFar: string[]) {
        if (node === null || node === undefined) {
          badLeaves.push(pathSoFar.join("."));
          return;
        }
        if (typeof node === "object" && !Array.isArray(node)) {
          for (const [key, value] of Object.entries(node)) walk(value, [...pathSoFar, key]);
          return;
        }
        if (typeof node === "string" && node.trim() === "") badLeaves.push(pathSoFar.join("."));
      }
      walk(tokens, []);

      assert.deepEqual(badLeaves, []);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
