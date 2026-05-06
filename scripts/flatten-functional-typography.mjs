#!/usr/bin/env node
/**
 * Strip Figma / W3C DTCG metadata from a typography export (strings, numbers, optional colors).
 *
 * Usage:
 *   node scripts/flatten-functional-typography.mjs <input.json> [output.json]
 *
 * Example:
 *   node scripts/flatten-functional-typography.mjs ~/Desktop/Mode\ 1.tokens.json tokens/functional/typography/globals.json
 *
 * Output shape (matches functional/colors/globals.json pattern):
 *   { "typography": { ... leaves are { "value": string | number } } }
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

function stripLeaf(node) {
  if (!isPlain(node) || !("$type" in node) || !("$value" in node)) {
    return null;
  }
  const t = node.$type;
  const v = node.$value;
  if (t === "string" || t === "number" || t === "boolean") {
    return { value: v };
  }
  if (t === "color") {
    const css = colorToCss(v);
    if (css) return { value: css };
    if (typeof v === "string") return { value: v };
    return { value: "#000000" };
  }
  return { value: v };
}

function strip(node) {
  const leaf = stripLeaf(node);
  if (leaf) return leaf;
  if (!isPlain(node)) return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith("$")) continue;
    out[k] = strip(v);
  }
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const defaultOut = path.join(
    process.cwd(),
    "tokens/functional/typography/globals.json",
  );

  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") {
    console.error(`Usage: node scripts/flatten-functional-typography.mjs <input.json> [output.json]

  input   Figma-exported JSON (typography: fontStack, heading, body, text, …)
  output  default: tokens/functional/typography/globals.json
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
  const stripped = strip(input);
  const out = { typography: stripped };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outputPath}`);
}

main();
