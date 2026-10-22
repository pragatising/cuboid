#!/usr/bin/env node
/**
 * Fails if `@material-symbols-svg` (or other raw icon-glyph packages) is
 * imported anywhere in `src/` outside the build-time manifest lookups.
 *
 * The variable-font adapter (`materialSymbolsIconLibrary`) renders glyphs as
 * ligature text — there is no per-glyph SVG component to import anymore, so
 * any `@material-symbols-svg` import in application/component code is a sign
 * someone reached around `<Icon name="..." />` instead of using it.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "src");

// The only code that may read the glyph package (build-time manifest data) now lives in
// packages/primitives/scripts/icons/, outside this package's src/ — nothing here is allowed.
const ALLOWED = new Set();

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
  if (ALLOWED.has(file)) continue;

  const lines = fs.readFileSync(file, "utf8").split("\n");
  for (const [index, line] of lines.entries()) {
    if (!isImportLine(line)) continue;
    for (const pkg of FORBIDDEN) {
      if (line.includes(pkg)) {
        violations.push(`${path.relative(ROOT, file)}:${index + 1} imports ${pkg}`);
      }
    }
  }
}

if (violations.length) {
  console.error(
    "Icon import policy violation — use `<Icon name=\"...\" />` instead of importing glyph packages directly:\n"
  );
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log("Icon imports OK (no direct @material-symbols-svg imports outside build scripts).");
