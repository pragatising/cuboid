#!/usr/bin/env node
/**
 * Fails if Material icon packages are imported outside approved files
 * (keeps all glyphs on Material Symbols Rounded via source.ts).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_FILE = path.join(ROOT, "src/icons/material/source.ts");
const CREATE_FILE = path.join(ROOT, "src/icons/material/createMaterialIcon.tsx");
const SRC_DIR = path.join(ROOT, "src/icons");

const FORBIDDEN = ["@material-symbols-svg", "react-icons/md"];

function isImportLine(line) {
  return /^\s*import\s/.test(line) || /import\s*\(\s*['"]/.test(line);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const violations = [];

for (const file of walk(SRC_DIR)) {
  if (file === SOURCE_FILE || file === CREATE_FILE) continue;

  const lines = fs.readFileSync(file, "utf8").split("\n");
  for (const [index, line] of lines.entries()) {
    if (!isImportLine(line)) continue;
    for (const pkg of FORBIDDEN) {
      if (line.includes(pkg)) {
        violations.push(
          `${path.relative(ROOT, file)}:${index + 1} imports ${pkg}`
        );
      }
    }
  }
}

if (violations.length) {
  console.error(
    "Icon import policy violation — use src/icons/material/index.ts exports instead:\n"
  );
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log("Icon imports OK (Material Symbols Rounded via source.ts only).");
