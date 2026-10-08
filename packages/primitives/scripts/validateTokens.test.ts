import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { designToken } from "../src/schemas/designToken.ts";

/**
 * Covers two things: the `designToken` schema's own behavior against
 * representative valid/invalid token trees (unit-level — no file I/O),
 * and the real scripts/validateTokens.ts CLI run as a subprocess against
 * cuboid's actual src/tokens/ tree (end-to-end — this is the only test
 * in the suite that exercises the full "walk real files, parse, report"
 * path, not just the schema in isolation).
 */

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(__dirname, "validateTokens.ts");

describe("designToken schema — representative cases", () => {
  it("accepts a well-formed dimension token", () => {
    const result = designToken.safeParse({
      sizes: { gap: { $value: { value: 1, unit: "rem" }, $type: "dimension" } },
    });
    assert.ok(result.success);
  });

  it("rejects a bare string where a dimension object is required — the real sidebar.widthMinimized bug", () => {
    const result = designToken.safeParse({
      sizes: { widthMinimized: { $value: "3.6rem", $type: "dimension" } },
    });
    assert.ok(!result.success);
  });

  it("accepts custom-string for a raw CSS value with no dimension equivalent — the real sheet.maxHeight fix", () => {
    const result = designToken.safeParse({
      sizes: { maxHeight: { $value: "90vh", $type: "custom-string" } },
    });
    assert.ok(result.success);
  });

  it("accepts a decimal-fraction token name — the real shadowAlpha.black['0.05'] case", () => {
    const result = designToken.safeParse({
      shadowAlpha: { black: { "0.05": { $value: "#000000", alpha: 0.05, $type: "color" } } },
    });
    assert.ok(result.success);
  });

  it("rejects an unknown $type", () => {
    const result = designToken.safeParse({
      sizes: { gap: { $value: "1rem", $type: "not-a-real-type" } },
    });
    assert.ok(!result.success);
  });

  it("rejects a group with an unknown $-prefixed property", () => {
    const result = designToken.safeParse({
      sizes: { $madeUpProperty: true },
    });
    assert.ok(!result.success);
  });
});

describe("scripts/validateTokens.ts — end to end against the real token tree", () => {
  it("exits 0 and reports every real token file in src/tokens/ as valid", async () => {
    // Not --silent: that flag suppresses the summary line too (by design —
    // "silent" means the exit code is the only signal), and this test
    // needs the "N/N token files valid." line from stdout.
    const { stdout } = await execFileAsync("node", [SCRIPT_PATH]);
    const match = stdout.match(/(\d+)\/(\d+) token files valid\./);
    assert.ok(match, "expected a 'N/N token files valid.' summary line");
    const [, validCount, totalCount] = match;
    assert.equal(validCount, totalCount, "every real token file in src/tokens/ should currently pass schema validation");
  });
});

describe("scripts/validateTokens.ts — end to end against a fixture tree", () => {
  async function withFixtureDir(fileName: string, contents: string) {
    const dir = await mkdtemp(path.join(tmpdir(), "cuboid-validate-tokens-test-"));
    await writeFile(path.join(dir, fileName), contents, "utf8");
    return dir;
  }

  it("exits 0 for a well-formed fixture", async () => {
    const dir = await withFixtureDir(
      "good.json5",
      `{ sizes: { gap: { $value: { value: 1, unit: 'rem' }, $type: 'dimension' } } }`,
    );
    try {
      const { stdout } = await execFileAsync("node", [SCRIPT_PATH, "--dir", dir]);
      assert.match(stdout, /1\/1 token files valid\./);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("exits 1 and reports the broken path for a fixture with a bare-string dimension — the real sidebar.widthMinimized bug, reproduced", async () => {
    const dir = await withFixtureDir(
      "bad.json5",
      `{ sizes: { widthMinimized: { $value: '3.6rem', $type: 'dimension' } } }`,
    );
    try {
      await assert.rejects(execFileAsync("node", [SCRIPT_PATH, "--dir", dir]), (error: unknown) => {
        const { code, stdout } = error as { code: number; stdout: string };
        assert.equal(code, 1);
        assert.match(stdout, /widthMinimized/);
        return true;
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("exits 1 for invalid JSON5 syntax, reported distinctly from a schema failure", async () => {
    const dir = await withFixtureDir("broken-syntax.json5", `{ sizes: { gap: `);
    try {
      await assert.rejects(execFileAsync("node", [SCRIPT_PATH, "--dir", dir]), (error: unknown) => {
        const { code, stdout } = error as { code: number; stdout: string };
        assert.equal(code, 1);
        assert.match(stdout, /Invalid JSON5/);
        return true;
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
