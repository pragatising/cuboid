import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { Plugin } from "vite";
import type { BenchConfig } from "./config";

/**
 * `virtual:source-hash`: a fingerprint of everything a check's answer depends on: the library's source and styles, its tokens, the
 * engine and the host that compose and judge the examples, and the version of the audit (axe). It is taken when the page loads, so a
 * saved answer is only used while none of that has changed since it was saved.
 */
/** What Bench itself judges by: the engine, and the host that composes and judges the examples. */
const OWN = [path.join(__dirname, "engine"), path.join(__dirname, "shell/playground"), path.join(__dirname, "shell/issues")];
const COUNTS = /\.(tsx?|css|json5?)$/;
const NOT_COUNTED = /\.(test|stories|examples)\.|\.d\.ts$|\/fixtures\//;

function files(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : COUNTS.test(entry.name) && !NOT_COUNTED.test(full) ? [full] : [];
  });
}

export function sourceHash(config: BenchConfig, base: string): string {
  const inputs = [
    // Each package's source (the folder its entry is in) and what else the config says changes an answer (the tokens).
    ...config.packages.map((pkg) => path.dirname(path.resolve(base, pkg.root, pkg.entry))),
    ...(config.watch ?? []).map((folder) => path.resolve(base, folder)),
    ...OWN,
  ];
  const hash = crypto.createHash("sha1");
  for (const file of inputs.flatMap(files).sort()) hash.update(file).update(fs.readFileSync(file));
  try {
    hash.update(fs.readFileSync(createRequire(__filename).resolve("axe-core/package.json")));
  } catch {
    // No audit installed: nothing of it to fingerprint.
  }
  return hash.digest("hex").slice(0, 16);
}

export function sourceHashPlugin(config: BenchConfig, base: string): Plugin {
  const id = "virtual:source-hash";
  return {
    name: "source-hash",
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    load: (loaded) => (loaded === `\0${id}` ? `export default ${JSON.stringify(sourceHash(config, base))};` : undefined),
  };
}
