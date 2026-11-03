// Builds Bench's theme: Cuboid's tokens with `theme/overrides.json5` merged over them, into `.theme/` (css/theme.css, js/tokens.js).
// Run: bench generate (and so bench dev / build). vite.config.ts loads this in place of the primitives' own build.
import path from "node:path";
import { fileURLToPath } from "node:url";

// The build is the primitives' own TypeScript source, run by vite-node: named in a variable so Bench's type-check does not read it.
const entry = "@sragatiping/cuboid-primitives/build";
const { build } = (await import(/* @vite-ignore */ entry)) as { build: (options: { outDir: string; overrides?: string[]; silent?: boolean }) => Promise<void> };

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

await build({ outDir: path.join(here, ".theme"), overrides: [path.join(here, "theme/overrides.json5")], silent: true });
console.log("theme: .theme (Cuboid's tokens + theme/overrides.json5)");
