#!/usr/bin/env node
/**
 * Real token build entry point — configuration only, per Primer's real
 * scripts/buildTokens.ts precedent: Style Dictionary itself does the
 * merge, reference-resolution, transform, and emit work internally (see
 * DESIGN.md §3). This script's only job is to point Style Dictionary at
 * the right source files and platform configs.
 *
 * Usage: node scripts/build-tokens.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import { styleDictionary } from "../src/styleDictionary.ts";
import { css } from "../src/platforms/css.ts";
import { json } from "../src/platforms/json.ts";
import { javascript } from "../src/platforms/javascript.ts";
import { typescript } from "../src/platforms/typescript.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
// Build output stays INSIDE this package. It used to be written across the
// workspace boundary into packages/react/src/theme/output — inherited from
// before the Phase -1 split, when tokens and React code shared one package.
// That inverted the dependency (react depends on primitives, so primitives
// must not depend on react's directory layout) and made the output
// unconsumable by anything other than react: no Figma sync, no docs, no
// non-react consumer. dist/ is also what Primer publishes (dist/css/,
// dist/docs/), and what package.json's `files`/`exports` point at.
const OUTPUT_DIR = path.join(ROOT, "dist");

async function main() {
  const extendedSD = await styleDictionary.extend({
    // base/ goes in `include`, not `source`: include'd tokens are available
    // for {path} reference resolution but are NOT emitted and are NOT treated
    // as source. That is the real Style Dictionary mechanism for a base layer
    // that exists only to be referenced (Primer does the same in
    // scripts/themes.config.ts). Putting base/ in `source` is what caused
    // every base token to be transformed to its final CSS string in the same
    // pass a functional token's reference to it resolved.
    include: [path.join(ROOT, "src", "tokens", "base", "**", "*.json5")],
    source: [
      path.join(ROOT, "src", "tokens", "functional", "**", "*.json5"),
      path.join(ROOT, "src", "tokens", "components", "**", "*.json5"),
    ],
    // A real gate, not just noise. Style Dictionary does NOT fail on a
    // transform error by default: it logs it, substitutes the
    // untransformed value, and still exits 0 — so a green build is not
    // evidence of a correct build (this is how 224 transform errors sat
    // behind an exit code of 0). `warnings: "error"` promotes transform
    // errors to a thrown error; `errors.brokenReferences: "throw"` does
    // the same for unresolvable {references}, matching Primer's own
    // scripts/buildTokens.ts.
    log: {
      verbosity: "verbose",
      warnings: "error",
      errors: { brokenReferences: "throw" },
    },
    platforms: {
      css: css("css/theme.css", "cube", `${OUTPUT_DIR}/`),
      json: json("tokens.json", undefined, `${OUTPUT_DIR}/`),
      // ESM — the real consumer seam for ADR-04 (resolved values, statically
      // imported, no CSS var / no React context). .js, not .mjs: this
      // package's package.json already declares "type": "module", so .js
      // resolves as ESM without needing the extension to carry that signal.
      typescript: typescript("tokens.js", undefined, `${OUTPUT_DIR}/js/`),
      // CommonJS — no current consumer (packages/react is ESM), kept for
      // any future non-ESM consumer, matching Primer's own unused-but-real
      // javascript.ts platform.
      javascript: javascript("tokens.js", undefined, `${OUTPUT_DIR}/cjs/`),
    },
  });

  await extendedSD.buildAllPlatforms();
}

main().catch((error) => {
  console.error("Token build failed:", error);
  process.exit(1);
});
