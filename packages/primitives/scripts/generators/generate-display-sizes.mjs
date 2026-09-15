#!/usr/bin/env node
/**
 * WHY THIS EXISTS: functional/space/space.json (the old file) was a flat,
 * pre-DTCG list of raw px values ("1px".."560px") used for anything —
 * gap, padding, width, margin — under the misleading name "space", even
 * though a lot of its real usages (container/panel widths) have nothing
 * to do with the space between two things. That's a real naming
 * conflation: "space" should mean spacing, not "any size at all". This
 * generator produces the corrected replacement: display-sizes.json5, a
 * neutral, reusable dimension scale with no assumed purpose — usable for
 * size, gap, padding, or anything else that needs one of these exact
 * pixel values. The real semantic "space" layer (xxs/sm/md/lg/xl, meaning
 * spacing) already exists separately in functional/space/space.json5 and
 * is untouched by this script.
 *
 * WHAT IT DOES: one entry per key that existed in the old space.json,
 * each now $type: 'dimension' referencing the matching base.size.N (all
 * 47 old values are confirmed present in the base scale, including the 6
 * wide values 28/272/320/400/480/560 added specifically to cover this).
 * No org.primer.llm — this file carries no usage guidance, since a
 * general-purpose size value has no single correct usage to prescribe;
 * that's the job of whatever semantic/component token references it.
 *
 * This is a generator, not part of the build: it was run once to produce
 * display-sizes.json5, and that file (not this script) is what the real
 * token pipeline reads.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, "../../src/tokens/functional/size/display-sizes.json5");

// Exact key list carried over from the old functional/space/space.json,
// in its original order.
const STEPS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 22, 24, 28, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112,
  120, 128, 136, 144, 152, 160, 168, 176, 184, 192, 200, 240, 272, 320, 400, 480, 560,
];

function entry(n) {
  return `    '${n}': {
      $value: '{base.size.${n}}',
      $type: 'dimension',
    },`;
}

function main() {
  const body = STEPS.map(entry).join("\n");
  const out = `{
  displaySizes: {
${body}
  },
}
`;
  fs.writeFileSync(OUTPUT, out);
  console.log(`Wrote ${OUTPUT}`);
}

main();
