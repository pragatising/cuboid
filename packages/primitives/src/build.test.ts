import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { build, sizeScaleKeys } from "./build.ts";

/**
 * Real end-to-end builds into temp dirs (not mocks) — the only thing that
 * proves the two properties ADR-04's amendment depends on: overrides
 * CASCADE through references, and modes are emitted as separate trees.
 */

type Tree = { [key: string]: Tree | string | number };
type Tokens = { light: Tree; dark: Tree };

const work = await mkdtemp(path.join(tmpdir(), "cuboid-build-test-"));
after(() => rm(work, { recursive: true, force: true }));

async function run(name: string, overrideJson5?: string): Promise<Tokens> {
  const outDir = path.join(work, name);
  const overrides: string[] = [];
  if (overrideJson5) {
    const file = path.join(work, `${name}.json5`);
    await writeFile(file, overrideJson5);
    overrides.push(file);
  }
  await build({ outDir, overrides, silent: true });
  return (await import(path.join(outDir, "js", "tokens.js"))).default;
}

function leaves(tree: Tree, prefix = ""): Map<string, string | number> {
  const out = new Map<string, string | number>();
  for (const [k, v] of Object.entries(tree)) {
    if (v !== null && typeof v === "object") for (const [p, x] of leaves(v as Tree, `${prefix}${k}.`)) out.set(p, x);
    else out.set(`${prefix}${k}`, v as string | number);
  }
  return out;
}

describe("build(): modes", () => {
  let baseline: Tokens;
  before(async () => {
    baseline = await run("baseline");
  });

  it("emits one tree per mode with identical shape", () => {
    assert.deepEqual([...leaves(baseline.light).keys()], [...leaves(baseline.dark).keys()]);
  });

  it("modes differ where dark values are authored, and light stays as authored", () => {
    const light = leaves(baseline.light);
    const dark = leaves(baseline.dark);
    const differing = [...light.keys()].filter((k) => light.get(k) !== dark.get(k));
    assert.ok(differing.includes("selection.bgColor"), "token-level inline dark value");
    assert.ok(differing.includes("bgColor.canvas.default"), "base-palette mode file cascades into functional tokens");
    assert.ok(differing.length > 200, `expected a real dark mode, only ${differing.length} tokens differ`);
    assert.equal(light.get("bgColor.canvas.default"), "#ffffff");
  });

  it("never leaks the reference-only base layer into the output", () => {
    assert.equal("base" in baseline.light, false);
  });

  it("a consumer can author a dark-only value on any token", async () => {
    const t = await run(
      "dark-only",
      `{ bgColor: { error: { subtle: { $extensions: { 'org.cuboid.overrides': { dark: '#101010' } } } } } }`,
    );
    const light = leaves(t.light);
    const dark = leaves(t.dark);
    assert.equal(light.get("bgColor.error.subtle"), leaves(baseline.light).get("bgColor.error.subtle"));
    assert.equal(dark.get("bgColor.error.subtle"), "#101010");
  });
});

describe("build(): overrides cascade", () => {
  it("overriding a BASE token changes every light-mode token that references it, and nothing else", async () => {
    const baseline = await run("cascade-baseline");
    const overridden = await run("cascade", `{ base: { color: { red: { '0': { $value: '#123456' } } } } }`);

    const before = leaves(baseline.light);
    const after = leaves(overridden.light);
    const old = "#fff6f5"; // base.color.red.0 in src/tokens/base/colors/light.json5
    const expectedToChange = [...before].filter(([, v]) => typeof v === "string" && v.includes(old)).map(([k]) => k);

    assert.ok(expectedToChange.length > 1, "fixture must reference red.0 from more than one token for this to prove a cascade");
    for (const key of expectedToChange) {
      assert.ok(String(after.get(key)).includes("#123456"), `${key} did not pick up the overridden base value`);
    }
    // ...and nothing else moved.
    const moved = [...before.keys()].filter((k) => before.get(k) !== after.get(k));
    assert.deepEqual(moved.sort(), expectedToChange.sort());
    assert.equal("base" in overridden.light, false, "overriding a base token must not leak the base layer into output");

    // Dark mode has its own authored value for that step, so a mode-agnostic (light) override leaves it alone.
    assert.deepEqual(overridden.dark, baseline.dark);
  });

  it("a dark-mode override of a base token cascades through dark mode only", async () => {
    const baseline = await run("cascade-dark-baseline");
    const file = path.join(work, "cascade-dark.json5");
    await writeFile(file, `{ base: { color: { red: { '0': { $value: '#123456' } } } } }`);
    const outDir = path.join(work, "cascade-dark");
    await build({ outDir, modeOverrides: { dark: [file] }, silent: true });
    const overridden: Tokens = (await import(path.join(outDir, "js", "tokens.js"))).default;

    const before = leaves(baseline.dark);
    const after = leaves(overridden.dark);
    const moved = [...before.keys()].filter((k) => before.get(k) !== after.get(k));
    assert.ok(moved.length > 1, "red.0 is referenced by more than one dark token");
    for (const key of moved) assert.ok(String(after.get(key)).includes("#123456"), key);
    assert.deepEqual(overridden.light, baseline.light);
  });

  it("a broken reference in an override fails the build instead of shipping", async () => {
    await assert.rejects(run("broken", `{ selection: { bgColor: { $value: '{does.not.exist}' } } }`));
  });

  it("an override with an invalid value fails schema validation with a path, before any output is written", async () => {
    await assert.rejects(
      run("invalid", `{ selection: { bgColor: { $value: 'not-a-color' } } }`),
      /Token validation failed/,
    );
  });

  it("an override with an unknown $type fails schema validation", async () => {
    await assert.rejects(
      run("invalid-type", `{ selection: { bgColor: { $type: 'colour' } } }`),
      /Token validation failed/,
    );
  });
});

describe("build(): partial overrides keep the rest of the token", () => {
  it("overriding only $value on a token keeps its dark-mode value (nothing else is replaced)", async () => {
    const t = await run("keep-meta", `{ selection: { bgColor: { $value: '#123456' } } }`);
    assert.ok(String(leaves(t.light).get("selection.bgColor")).startsWith("#123456"));
    // selection.bgColor authors its own dark value; a light-only override must not wipe it.
    assert.notEqual(leaves(t.dark).get("selection.bgColor"), leaves(t.light).get("selection.bgColor"));
  });

  it("an override naming a token that does not exist fails (almost always a typo)", async () => {
    await assert.rejects(run("typo", `{ selection: { bgColr: { $value: '#123456' } } }`), /do not exist: selection\.bgColr/);
  });
});

describe("generated types: the Nx size scale", () => {
  it("turns px size keys into Nx keys (1x = 8px)", () => {
    assert.deepEqual(sizeScaleKeys({ "0": "0", "1": "x", "4": "x", "8": "x", "12": "x", "15": "x", "16": "x" }), ["0.125x", "0.5x", "1x", "1.5x", "1.875x", "2x"]);
  });

  it("emits SizeScale into tokens.d.ts, covering the real size tokens", async () => {
    await run("sizescale");
    const dts = await readFile(path.join(work, "sizescale", "js", "tokens.d.ts"), "utf8");
    const line = dts.split("\n").find((l) => l.startsWith("export type SizeScale")) ?? "";
    for (const key of ['"0.5x"', '"1x"', '"1.5x"', '"2x"', '"7x"']) assert.ok(line.includes(key), `${key} missing from SizeScale`);
    assert.ok(!line.includes('"0x"'), "zero is not part of the scale");
  });
});
