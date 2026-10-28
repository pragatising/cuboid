// Reads every exported component's source and writes dev/generated/models.json: for each, what is written in it (its parameters
// and props, the hooks it calls, what its body declares, the tree it returns, what wraps it and is attached to it). The docs shell's
// examples are composed from these. Nothing in it is written by hand.
// Run: npm run build:models
import fs from "node:fs";
import path from "node:path";
import { extractLibrary } from "../dev/engine/extract/extractLibrary";

const root = process.cwd();
const library = extractLibrary(path.join(root, "src/index.ts"), root);
const out = {
  /** Exported name -> where it is written. */
  exports: Object.fromEntries(Object.entries(library.components).map(([name, { model }]) => [name, model.declared])),
  /** Every component read, by where it is written: the exported ones and the ones they use. */
  models: Object.fromEntries(Object.entries(library.all).map(([id, { model }]) => [id, model])),
};
fs.mkdirSync(path.join(root, "dev/generated"), { recursive: true });
fs.writeFileSync(path.join(root, "dev/generated/models.json"), JSON.stringify(out));
const unsupported = Object.entries(library.all).flatMap(([id, e]) => e.unsupported.map((u) => `${id}: ${u.kind}`));
console.log(`models.json: ${Object.keys(out.models).length} components (${Object.keys(out.exports).length} exported)${unsupported.length ? `, ${unsupported.length} unsupported: ${unsupported.join(", ")}` : ""}`);
