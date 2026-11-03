// Cuboid's adapter for Bench: a component here writes a default as a token lookup (`resolved<CssColor>(callout.bgColor)`), and Bench, which knows nothing
// of tokens, asks this what that applies. It reads Cuboid's token files, where a token can be written as another (`{bgColor.canvas.inset}`).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSON5 from "json5";
import type { PropInfo } from "@sragatiping/bench";

const here = path.dirname(fileURLToPath(import.meta.url));
const TOKENS = path.resolve(here, "../../primitives/src/tokens");
const SETS = path.resolve(here, "../.bench/token-sets.json");

const files = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : /\.json5?$/.test(entry.name) ? [full] : [];
  });

/** Each token whose value is a reference, by its path: `{ "callout.bgColor": "bgColor.canvas.inset" }`. */
function refsIn(node: unknown, at: string[], found: Record<string, string>) {
  if (!node || typeof node !== "object") return;
  const value = (node as Record<string, unknown>).$value;
  if (typeof value === "string") {
    const ref = /^\{([^{}]+)\}$/.exec(value)?.[1];
    if (ref) found[at.join(".")] = ref;
    return;
  }
  for (const [key, child] of Object.entries(node)) if (!key.startsWith("$")) refsIn(child, [...at, key], found);
}

let refs: Record<string, string> | undefined;
const references = () => {
  if (!refs) {
    refs = {};
    if (fs.existsSync(TOKENS)) for (const file of files(TOKENS)) refsIn(JSON5.parse(fs.readFileSync(file, "utf8")), [], refs);
  }
  return refs;
};

/**
 * What a component writes for a prop, as the prop's own type writes it. `resolved<CssColor>(callout.bgColor)` is the token `callout.bgColor`, which the token
 * source says is `{bgColor.canvas.inset}`: the prop shows `"canvas.inset"` when its type has that token. A token its type has no name for, and anything else (a variable, a call, which
 * is only known when it runs), is left to be shown as written.
 */
export function resolveDefault(expression: string, prop: PropInfo): string | undefined {
  const route = /^resolved<[^>]*>\(([\w.]+)\)$/.exec(expression)?.[1];
  const ref = route ? references()[route] : undefined;
  if (!ref) return undefined;
  const sets: Record<string, (string | number)[]> = fs.existsSync(SETS) ? JSON.parse(fs.readFileSync(SETS, "utf8")) : {};
  const named = (prop.members ?? []).flatMap((member) => (member.set ? (sets[member.set] ?? []).map(String) : [])).find((name) => ref.endsWith(`.${name}`) && !ref.slice(0, -name.length - 1).includes("."));
  return named ? JSON.stringify(named) : undefined;
}
