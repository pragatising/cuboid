// Reads every exported component's props from the TypeScript types and JSDoc and writes components.json (and token-sets.json) to the
// config's `out`: the data behind Bench's Properties (and, later, an llms.txt and a CI check). Nothing in it is written by hand.
// Run: npm run bench:generate
import fs from "node:fs";
import path from "node:path";
import { loadBench, outOf } from "../load";
import { readLibrary } from "./readLibrary.mjs";

const { config, base } = await loadBench();
// Ids are relative to the first package, the one examples are written against.
const root = path.resolve(base, config.packages[0].root);
const entries = config.packages.map((pkg) => path.resolve(base, pkg.root, pkg.scan ?? pkg.entry));
const packageRoots = config.packages.map((pkg) => path.resolve(base, pkg.root));
const { components, sets } = readLibrary({ entries, root, packageRoots });
const outDir = outOf(config, base);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "components.json"), `${JSON.stringify(components, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "token-sets.json"), JSON.stringify(sets));
const props = Object.values(components).reduce((n, c) => n + c.props.length, 0);
console.log(`components.json: ${Object.keys(components).length} components, ${props} props -> ${path.relative(root, path.join(outDir, "components.json"))}`);
