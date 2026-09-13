#!/usr/bin/env node
/**
 * Enforces the one hard boundary in the workspace split: packages/primitives
 * must never depend on react. npm's default hoisting means a stray `import
 * "react"` here would still *resolve* at runtime (react lives in the shared
 * root node_modules for packages/react's sake) — so this can't be caught by
 * npm install alone. This grep is the actual enforcement mechanism.
 *
 * Usage: node scripts/check-no-react.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const REACT_IMPORT_PATTERN = /from\s+["']react(-dom)?(\/|["'])|require\(\s*["']react(-dom)?(\/|["'])/;

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, acc);
    else if (/\.(mjs|js|ts|tsx|jsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function main() {
  const files = [
    ...walkFiles(path.join(ROOT, "scripts")),
    ...walkFiles(path.join(ROOT, "src")),
  ];

  const violations = [];
  for (const file of files) {
    if (file === __filename) continue;
    const content = fs.readFileSync(file, "utf8");
    if (REACT_IMPORT_PATTERN.test(content)) {
      violations.push(path.relative(ROOT, file));
    }
  }

  if (violations.length > 0) {
    console.error("packages/primitives must never import react. Found:");
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
  }

  console.log("OK — no react import found under packages/primitives.");
}

main();
