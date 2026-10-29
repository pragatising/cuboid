import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * `virtual:source-hash`: a fingerprint of everything a check's answer depends on: the library's source and styles, its tokens, the
 * engine and the host that compose and judge the examples, and the version of the audit (axe). It is taken when the page loads, so a
 * saved answer is only used while none of that has changed since it was saved.
 */
const ROOT = path.resolve(__dirname, "..");
const INPUTS = [
  path.join(ROOT, "src"),
  path.resolve(ROOT, "../primitives/src/tokens"),
  path.join(__dirname, "engine"),
  path.join(__dirname, "shell/playground"),
  path.join(__dirname, "shell/issues"),
];
const COUNTS = /\.(tsx?|css|json5?)$/;
const NOT_COUNTED = /\.(test|stories|examples)\.|\.d\.ts$|\/fixtures\//;

function files(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : COUNTS.test(entry.name) && !NOT_COUNTED.test(full) ? [full] : [];
  });
}

export function sourceHash(): string {
  const hash = crypto.createHash("sha1");
  for (const file of INPUTS.flatMap(files).sort()) hash.update(file).update(fs.readFileSync(file));
  const axe = path.resolve(ROOT, "../../node_modules/axe-core/package.json");
  if (fs.existsSync(axe)) hash.update(fs.readFileSync(axe));
  return hash.digest("hex").slice(0, 16);
}

export function sourceHashPlugin(): Plugin {
  const id = "virtual:source-hash";
  return {
    name: "source-hash",
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    load: (loaded) => (loaded === `\0${id}` ? `export default ${JSON.stringify(sourceHash())};` : undefined),
  };
}
