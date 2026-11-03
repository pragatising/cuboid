// Reads each component's status from the tracker the config names and writes status.json to its `out`, for Bench's Overview. The tracker is
// where status is kept; this only reads it.
// Run: npm run bench:generate
import fs from "node:fs";
import path from "node:path";
import { readStatuses } from "../shell/overview/status";
import { loadBench, outOf } from "../load";

const { config, base } = await loadBench();
const tracker = config.tracker ? path.resolve(base, config.tracker) : undefined;
const found = tracker !== undefined && fs.existsSync(tracker);
const statuses = found ? readStatuses(fs.readFileSync(tracker, "utf8")) : {};
const out = outOf(config, base);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "status.json"), JSON.stringify(statuses));
console.log(`status.json: ${Object.keys(statuses).length} components${found ? "" : " (no tracker found)"}`);
