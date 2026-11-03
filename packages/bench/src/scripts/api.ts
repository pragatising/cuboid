// Writes api.json to the config's `out`: for every component and part, what a caller can set on it and what it sets itself, from what components.json and models.json
// read. The Properties panel reads this; it joins nothing itself. A library may give `adapters.resolveDefault` in its config for a default written as a lookup.
import fs from "node:fs";
import path from "node:path";
import { buildApi } from "../engine/api";
import type { LibraryFacts } from "../engine/api";
import { loadBench, outOf } from "../load";

const { config, base } = await loadBench();
const out = outOf(config, base);
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(out, file), "utf8"));
const api = buildApi({ components: read("components.json"), models: read("models.json") } satisfies LibraryFacts, config.adapters?.resolveDefault);
fs.writeFileSync(path.join(out, "api.json"), `${JSON.stringify(api)}\n`);
console.log(`api.json: ${Object.keys(api).length} components and parts`);
