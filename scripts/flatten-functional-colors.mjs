#!/usr/bin/env node
/**
 * Strip Figma / W3C DTCG noise from a functional color export and resolve {token.path} refs.
 *
 * Usage:
 *   node scripts/flatten-functional-colors.mjs <input.json> [output.json]
 *
 * Example:
 *   node scripts/flatten-functional-colors.mjs ~/Desktop/functional_colors/light.tokens.json tokens/functional/colors/globals.json
 *
 * Output shape (folder is already functional/colors — no extra "functional" key):
 *   { "color": { ... same nesting as input.colors, leaves are { "value": "#..." } } }
 */

import fs from "fs";
import path from "path";

const isPlain = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

function colorToCss(val) {
  if (typeof val === "string") return null;
  if (!isPlain(val) || typeof val.hex !== "string") return null;
  const hex = val.hex.startsWith("#") ? val.hex : `#${val.hex}`;
  const a = val.alpha;
  if (typeof a === "number" && a < 1) {
    const c = val.components;
    if (Array.isArray(c) && c.length >= 3) {
      const [r, g, b] = c;
      return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
    }
  }
  return hex;
}

function strip(node) {
  if (!isPlain(node)) return node;
  if (node.$type === "color") {
    const css = colorToCss(node.$value);
    if (css) return { value: css };
    if (typeof node.$value === "string") return { value: node.$value };
    return { value: "#000000" };
  }
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("$")) continue;
    out[k] = strip(v);
  }
  return out;
}

function getPath(root, parts) {
  let cur = root;
  for (const p of parts) {
    if (!isPlain(cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

function resolveOnce(root, node) {
  if (!isPlain(node)) return node;
  if (typeof node.value === "string") {
    const m = node.value.match(/^\{([^}]+)\}$/);
    if (m) {
      const targetPath = m[1].split(".");
      const target = getPath(root, targetPath);
      if (
        isPlain(target) &&
        typeof target.value === "string" &&
        !/^\{[^}]+\}$/.test(target.value)
      ) {
        return { value: target.value };
      }
    }
    return node;
  }
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    out[k] = resolveOnce(root, v);
  }
  return out;
}

function collectUnresolved(node, prefix = []) {
  const list = [];
  if (!isPlain(node)) return list;
  if (typeof node.value === "string" && /^\{[^}]+\}$/.test(node.value)) {
    list.push(`${prefix.join(".") || "(root)"} = ${node.value}`);
  }
  for (const [k, v] of Object.entries(node)) {
    list.push(...collectUnresolved(v, [...prefix, k]));
  }
  return list;
}

function main() {
  const argv = process.argv.slice(2);
  const defaultOut = path.join(
    process.cwd(),
    "tokens/functional/colors/globals.json",
  );

  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") {
    console.error(`Usage: node scripts/flatten-functional-colors.mjs <input.json> [output.json]

  input   Figma-exported JSON with top-level "colors" (DTCG / $type color tokens)
  output  default: tokens/functional/colors/globals.json
`);
    process.exit(argv[0] === "-h" || argv[0] === "--help" ? 0 : 1);
  }

  const inputPath = path.resolve(argv[0]);
  const outputPath = path.resolve(argv[1] ?? defaultOut);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    process.exit(1);
  }

  const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (!isPlain(input.colors)) {
    console.error('Expected top-level "colors" object in input JSON.');
    process.exit(1);
  }

  const root = { colors: strip(input.colors) };
  for (let i = 0; i < 100; i++) {
    const next = { colors: resolveOnce(root, root.colors) };
    if (JSON.stringify(next) === JSON.stringify(root)) break;
    root.colors = next.colors;
  }

  const unresolved = collectUnresolved(root.colors);
  if (unresolved.length > 0) {
    console.warn(`Warning: ${unresolved.length} unresolved token ref(s):`);
    unresolved.slice(0, 30).forEach((line) => console.warn(`  ${line}`));
    if (unresolved.length > 30) console.warn(`  … and ${unresolved.length - 30} more`);
  }

  const out = { color: root.colors };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outputPath}`);
}

main();
