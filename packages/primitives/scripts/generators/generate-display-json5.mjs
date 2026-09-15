#!/usr/bin/env node
/**
 * WHY THIS EXISTS: tokens/functional/colors/display.json5 needs the same
 * 16-token shape (scale.0-10 + bgColor.{muted,emphasis} + fgColor +
 * borderColor.{muted,emphasis}) repeated once per decorative color — 12
 * colors × 16 tokens = 192 near-identical entries. Hand-typing that much
 * repetition is exactly the kind of task that silently drifts (one color
 * gets bgColor.emphasis pointing at step 4 instead of 5, another is missing
 * $extensions) without anyone noticing until much later. Generating it
 * from one formula per color guarantees every color follows the identical
 * shape.
 *
 * WHAT IT DOES: follows Primer's real functional/color/display.json5
 * structure (verified against their live file) for the 12 hue-based
 * colors that actually exist in Cuboid's base scale (tokens/base/colors/
 * light.json5): gray, green, purple, indigo, blue, mag, yellow, red,
 * orange, violet, teal, lime.
 *
 * Deliberately omits org.primer.overrides (dark/high-contrast/colorblind
 * variants) — Cuboid has no theme/mode mechanism yet (see
 * docs/token-architecture-migration.md — "Zero. No dark mode, no override
 * mechanism at all"). Adding overrides here would be inventing values for
 * modes that don't exist. Re-run/extend this script once Phase 3 (dark
 * mode) lands.
 *
 * This is a generator, not part of the build: it was run once to produce
 * display.json5, and display.json5 (not this script) is what the real
 * token pipeline reads. Re-run only if the base color list changes or a
 * mistake is found in the generated shape.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, "../../src/tokens/functional/colors/display.json5");

// Colors confirmed present in tokens/base/colors/light.json5's scale, steps 0-10.
const COLORS = ["gray", "green", "purple", "indigo", "blue", "mag", "yellow", "red", "orange", "violet", "teal", "lime"];

function figmaExt(scopes) {
  return `{ collection: 'mode', group: 'component', scopes: [${scopes.map((s) => `'${s}'`).join(", ")}] }`;
}

function scaleBlock(color) {
  const lines = [];
  for (let i = 0; i <= 10; i++) {
    lines.push(`        '${i}': {
          $value: '{base.color.${color}.${i}}',
          $type: 'color',
          $extensions: { 'org.cuboid.figma': ${figmaExt(["bgColor", "borderColor"])} },
        },`);
  }
  return `      scale: {\n${lines.join("\n")}\n      },`;
}

function colorBlock(color) {
  return `    ${color}: {
${scaleBlock(color)}
      bgColor: {
        muted: {
          $value: '{base.color.${color}.0}',
          $type: 'color',
          $extensions: { 'org.cuboid.figma': ${figmaExt(["bgColor"])} },
        },
        emphasis: {
          $value: '{base.color.${color}.5}',
          $type: 'color',
          $extensions: { 'org.cuboid.figma': ${figmaExt(["bgColor"])} },
        },
      },
      fgColor: {
        $value: '{base.color.${color}.6}',
        $type: 'color',
        $extensions: { 'org.cuboid.figma': ${figmaExt(["fgColor"])} },
      },
      borderColor: {
        muted: {
          $value: '{base.color.${color}.1}',
          $type: 'color',
          $extensions: { 'org.cuboid.figma': ${figmaExt(["borderColor"])} },
        },
        emphasis: {
          $value: '{base.color.${color}.5}',
          $type: 'color',
          $extensions: { 'org.cuboid.figma': ${figmaExt(["borderColor"])} },
        },
      },
    },`;
}

function main() {
  const body = COLORS.map(colorBlock).join("\n");
  const out = `{
  display: {
    $description: 'Decorative colors for categorization and visual distinction without semantic meaning. Use for labels, tags, avatars, status indicators, and user-assigned colors. Do NOT use for success/error/warning states — use semantic colors (bgColor.status.*, borderColor.status.*) instead.',
${body}
  },
}
`;
  fs.writeFileSync(OUTPUT, out);
  console.log(`Wrote ${OUTPUT}`);
}

main();
