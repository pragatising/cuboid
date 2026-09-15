#!/usr/bin/env node
/**
 * WHY THIS EXISTS: tokens/base/size/size.json5 needs one entry per real
 * step in Cuboid's Figma "base/size" variable collection — 54 positive
 * values (0-24 step 1, then 32-256 step 8), each with the same repeated
 * $type/$extensions shape. Hand-typing 54 near-identical token blocks
 * invites copy-paste mistakes (a wrong number in one $value, a missed
 * $extensions somewhere); generating them from one formula guarantees
 * every step is internally consistent and matches Figma exactly.
 *
 * WHAT IT DOES: regenerates size.json5's positive steps — confirmed via
 * Figma screenshot this session: 0-24 in steps of 1 (25 values), then
 * 32-256 in steps of 8 (29 values) = 54 positive tokens. Replaced the
 * previous sparser hand-authored set (2,4,6,8,12,16,20,24,28,32,36,40,44,
 * 48,64,80,96,112,128). Negative-N entries are left exactly as they were
 * in the source file — regenerated verbatim from the NEGATIVES list
 * below, not touched or reordered, per explicit instruction to leave them
 * as-is.
 *
 * EXTRA_WIDE_STEPS (28, 272, 320, 400, 480, 560) were added afterward,
 * outside the regular step-8 pattern: these are real values the old
 * functional/space/space.json scale used for panel/sidebar/sheet-width
 * tokens, which don't fit the 0-256 UI-element sizing range the Figma
 * collection covers. Rather than leave those component-width tokens
 * pointing at nothing, or duplicating a second unrelated numbering, these
 * specific values were folded into the one base size scale so every
 * functional/component token can still trace to a real base.size.N.
 *
 * This is a generator, not part of the build: it was run once to produce
 * size.json5, and size.json5 (not this script) is what the real token
 * pipeline reads. Re-run only if the Figma base/size collection's step
 * list changes again, or another out-of-range value is needed.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, "../../src/tokens/base/size/size.json5");

const NEGATIVES = [2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48];
const EXTRA_WIDE_STEPS = [28, 272, 320, 400, 480, 560];

function positiveSteps() {
  const steps = [];
  for (let i = 0; i <= 24; i++) steps.push(i);
  for (let i = 32; i <= 256; i += 8) steps.push(i);
  for (const n of EXTRA_WIDE_STEPS) if (!steps.includes(n)) steps.push(n);
  return steps.sort((a, b) => a - b);
}

function positiveEntry(n) {
  return `      '${n}': {
        $value: { value: ${n}, unit: 'px' },
        $type: 'dimension',
        $extensions: {
          'org.cuboid.figma': {
            collection: 'base/size',
            scopes: ['size', 'gap'],
          },
        },
      },`;
}

function negativeEntry(n) {
  return `      'negative-${n}': {
        $value: { value: -${n}, unit: 'px' },
        $type: 'dimension',
      },`;
}

function main() {
  const positives = positiveSteps().map(positiveEntry).join("\n");
  const negatives = NEGATIVES.map(negativeEntry).join("\n");
  const out = `{
  base: {
    size: {
${positives}
${negatives}
    },
  },
}
`;
  fs.writeFileSync(OUTPUT, out);
  console.log(`Wrote ${OUTPUT}`);
}

main();
