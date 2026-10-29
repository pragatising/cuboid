// Reads each component's status from docs/backlog/react-migration-tracker.md and writes dev/generated/status.json, for the docs
// shell's Overview. The tracker is where status is kept; this only reads it.
// Run: npm run build:status
import fs from "node:fs";
import path from "node:path";
import { readStatuses } from "../dev/shell/overview/status";

const root = process.cwd();
const tracker = path.resolve(root, "../../docs/backlog/react-migration-tracker.md");
const statuses = fs.existsSync(tracker) ? readStatuses(fs.readFileSync(tracker, "utf8")) : {};
fs.mkdirSync(path.join(root, "dev/generated"), { recursive: true });
fs.writeFileSync(path.join(root, "dev/generated/status.json"), JSON.stringify(statuses));
console.log(`status.json: ${Object.keys(statuses).length} components${fs.existsSync(tracker) ? "" : " (no tracker found)"}`);
