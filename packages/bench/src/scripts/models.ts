// Reads every exported component's source and writes models.json to the config's `out`: for each, what is written in it (its parameters
// and props, the hooks it calls, what its body declares, the tree it returns, what wraps it and is attached to it). Bench's
// examples are composed from these. Nothing in it is written by hand.
// Run: npm run bench:generate
import fs from "node:fs";
import path from "node:path";
import { extractLibrary } from "../engine/extract/extractLibrary";
import { loadBench, outOf } from "../load";

const { config, base } = await loadBench();
// Ids are relative to the first package, the one examples are written against.
const root = path.resolve(base, config.packages[0].root);
const outDir = outOf(config, base);
const libraries = config.packages.map((pkg) => extractLibrary(path.resolve(base, pkg.root, pkg.scan ?? pkg.entry), root));
// A package that imports another by its name gets that one's build: what it reads there is already read from source, so only what is written in each package is kept.
const own = <T,>(entries: Record<string, T>) => Object.fromEntries(Object.entries(entries).filter(([id]) => !/(^|\/)dist\//.test(id)));
const library = { components: Object.assign({}, ...libraries.map((l) => own(l.components))), all: Object.assign({}, ...libraries.map((l) => own(l.all))) } as (typeof libraries)[number];
const out = {
  /** Exported name -> where it is written. */
  exports: Object.fromEntries(Object.entries(library.components).map(([name, { model }]) => [name, model.declared])),
  /** Every component read, by where it is written: the exported ones and the ones they use. */
  models: Object.fromEntries(Object.entries(library.all).map(([id, { model }]) => [id, model])),
};
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "models.json"), JSON.stringify(out));
const unsupported = Object.entries(library.all).flatMap(([id, e]) => e.unsupported.map((u) => `${id}: ${u.kind}`));
console.log(`models.json: ${Object.keys(out.models).length} components (${Object.keys(out.exports).length} exported)${unsupported.length ? `, ${unsupported.length} unsupported: ${unsupported.join(", ")}` : ""}`);
