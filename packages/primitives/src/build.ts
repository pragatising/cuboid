import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import JSON5 from "json5";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { applyOverrides } from "./applyOverrides.ts";
import { designToken } from "./schemas/designToken.ts";
import { styleDictionary } from "./styleDictionary.ts";
import { css } from "./platforms/css.ts";
import { json } from "./platforms/json.ts";
import { javascript } from "./platforms/javascript.ts";
import { typescript } from "./platforms/typescript.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export const DEFAULT_MODES = ["light", "dark"] as const;

export interface BuildOptions {
  /** Directory the build writes into (`css/`, `js/`, `cjs/`, `tokens.json`). */
  outDir: string;
  /**
   * Partial DTCG token files (absolute paths; `.json`/`.json5`, or a
   * `.ts`/`.js`/`.mjs` module whose default export is the object). Deep-merged
   * over the tokens in order (later files win) by the `consumerOverrides`
   * preprocessor, and `{references}` resolve AFTER the merge — so overriding
   * a base or functional token cascades into everything that references it
   * (ADR-04 amendment). Only existing tokens may be overridden.
   */
  overrides?: string[];
  /**
   * Per-mode partial token files, e.g. `{ dark: ["/abs/dark.json5"] }`. Same
   * format as `overrides` (plain `$value`, no extensions boilerplate), but each
   * value applies to that mode only. Layered on top of the built-in
   * `src/tokens/modes/<mode>/*.json5` files, which define cuboid's own modes.
   */
  modeOverrides?: Record<string, string[]>;
  /** Mode names to emit a resolved tree for. First is the fallback for tokens with no override. */
  modes?: readonly string[];
  silent?: boolean;
}

/**
 * The token build as a callable function (scripts/buildTokens.ts and the
 * future consumer CLI are thin wrappers). Emits the default CSS/JSON for
 * non-React consumers plus ONE resolved tree per mode, composed into
 * `js/tokens.js` / `cjs/tokens.js` as `{ light: {...}, dark: {...} }` with
 * a generated `js/tokens.d.ts`.
 */
export async function build({ outDir, overrides = [], modeOverrides = {}, modes = DEFAULT_MODES, silent = false }: BuildOptions) {
  const stage = await mkdtemp(path.join(tmpdir(), "cuboid-build-"));
  try {
    const platforms: Record<string, ReturnType<typeof css>> = {
      css: css("css/theme.css", "cube", `${outDir}/css/`),
      json: json("tokens.json", undefined, `${outDir}/`),
    };
    for (const mode of modes) {
      // Per-mode ESM + CJS into a throwaway stage; composed below.
      platforms[`typescript-${mode}`] = typescript(`${mode}.js`, undefined, `${stage}/js/`, { theme: mode });
      platforms[`javascript-${mode}`] = javascript(`${mode}.js`, undefined, `${stage}/cjs/`, { theme: mode });
    }

    const sd = await styleDictionary.extend({
      // base/ is `include` (reference-only, never emitted) — see the note in git history of scripts/buildTokens.ts.
      include: [path.join(ROOT, "src", "tokens", "base", "**", "*.json5")],
      source: [
        path.join(ROOT, "src", "tokens", "functional", "**", "*.json5"),
        path.join(ROOT, "src", "tokens", "components", "**", "*.json5"),
      ],
      preprocessors: ["consumerOverrides"],
      // Not in Style Dictionary's Config type, but it forwards top-level `options` to preprocessors.
      ...({ options: { consumerOverrides: await loadAllOverrides(overrides, modeOverrides, modes) } } as object),
      // A real gate: transform errors, token collisions between our own files,
      // and broken {references} all throw instead of exiting 0. (Consumer
      // overrides are merged by a preprocessor, not as colliding source files,
      // so they don't trip the collision check.)
      log: { verbosity: silent ? "silent" : "verbose", warnings: "error", errors: { brokenReferences: "throw" } },
      platforms,
    });
    // Validate the MERGED tree, not the files: an override file is partial
    // (e.g. just `$value`, no `$type`) and only becomes a complete token
    // after Style Dictionary merges it over ours. This is what catches a
    // consumer typo with a clear path/message instead of a silently
    // substituted value deep inside a transform.
    await sd.hasInitialized;
    const checked = designToken.safeParse(sd.tokens);
    if (!checked.success) throw new Error(`Token validation failed:\n${z.prettifyError(checked.error)}`);

    await sd.buildAllPlatforms();

    const trees: Record<string, unknown> = {};
    for (const mode of modes) {
      trees[mode] = (await import(`${pathToFileURL(path.join(stage, "js", `${mode}.js`)).href}`)).default;
    }
    await writeComposed(outDir, trees, modes);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Rewrites a plain partial token file into the inline-extension form the
 * existing `themeOverrides` preprocessor already understands: every token's
 * `$value` (plus sibling props like `alpha`) becomes
 * `$extensions['org.cuboid.overrides'][mode]`. That keeps ONE mode mechanism —
 * the inline one DESIGN.md §5 describes — while mode files stay plain.
 */
function asModeOverride(node: Record<string, unknown>, mode: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$") || !isPlainObject(value)) continue;
    if ("$value" in value) {
      const { $extensions: _ignored, ...override } = value;
      out[key] = { $extensions: { "org.cuboid.overrides": { [mode]: override } } };
    } else {
      out[key] = asModeOverride(value, mode);
    }
  }
  return out;
}

async function builtInModeFiles(mode: string): Promise<string[]> {
  const dir = path.join(ROOT, "src", "tokens", "modes", mode);
  try {
    return (await readdir(dir)).filter((f) => f.endsWith(".json5")).sort().map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

async function loadAllOverrides(overrides: string[], modeOverrides: Record<string, string[]>, modes: readonly string[]) {
  let merged: Record<string, unknown> = {};
  for (const mode of modes) {
    const files = [...(await builtInModeFiles(mode)), ...(modeOverrides[mode] ?? [])];
    for (const file of files) merged = applyOverrides(merged, asModeOverride(await loadOverrideFile(file), mode));
  }
  // Consumer's mode-agnostic overrides last: they win over cuboid's own mode files.
  return applyOverrides(merged, await loadOverrides(overrides));
}

async function loadOverrideFile(file: string): Promise<Record<string, unknown>> {
  return /\.(ts|js|mjs)$/.test(file) ? (await import(pathToFileURL(file).href)).default : JSON5.parse(await readFile(file, "utf8"));
}

async function loadOverrides(files: string[]): Promise<Record<string, unknown>> {
  let merged: Record<string, unknown> = {};
  for (const file of files) {
    merged = applyOverrides(merged, await loadOverrideFile(file));
  }
  return merged;
}

async function writeComposed(outDir: string, trees: Record<string, unknown>, modes: readonly string[]) {
  const body = JSON.stringify(trees, null, 2);
  await mkdir(path.join(outDir, "js"), { recursive: true });
  await mkdir(path.join(outDir, "cjs"), { recursive: true });
  await writeFile(path.join(outDir, "js", "tokens.js"), `export default ${body};\n`);
  await writeFile(path.join(outDir, "cjs", "tokens.js"), `module.exports = ${body};\n`);

  // Types are derived from the first mode's tree (every mode has the same shape).
  const shape = typeOf(trees[modes[0]], "");
  const union = modes.map((m) => JSON.stringify(m)).join(" | ");
  const scale = sizeScaleKeys((trees[modes[0]] as { size?: Record<string, unknown> }).size ?? {});
  await writeFile(
    path.join(outDir, "js", "tokens.d.ts"),
    `// Generated by src/build.ts — do not edit.\nexport type ModeName = ${union};\nexport type Tokens = ${shape};\n` +
      `/** The Nx spacing scale (1x = 8px): every non-zero \`size\` token, as a multiple of 8px. \`"1.5x"\` is \`tokens.size["12"]\`. */\n` +
      `export type SizeScale = ${scale.map((k) => JSON.stringify(k)).join(" | ")};\n` +
      `declare const tokens: Record<ModeName, Tokens>;\nexport default tokens;\n`,
  );
}

/**
 * The Nx scale keys derived from the px-keyed `size` tokens: `"12"` -> `"1.5x"` (1x = 8px).
 * Authoring stays in px (a "." in a token name would nest it in Style Dictionary), so the Nx
 * spelling exists only in the typed API.
 */
export function sizeScaleKeys(size: Record<string, unknown>): string[] {
  return Object.keys(size)
    .filter((k) => /^\d+$/.test(k) && Number(k) > 0)
    .map((k) => `${parseFloat((Number(k) / 8).toFixed(4))}x`);
}

function typeOf(value: unknown, indent: string): string {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const inner = indent + "  ";
    const lines = Object.entries(value).map(([k, v]) => `${inner}${JSON.stringify(k)}: ${typeOf(v, inner)};`);
    return `{\n${lines.join("\n")}\n${indent}}`;
  }
  if (Array.isArray(value)) return `Array<${value.length ? typeOf(value[0], indent) : "unknown"}>`;
  return typeof value === "number" ? "number" : "string";
}
