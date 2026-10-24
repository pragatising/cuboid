import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * The built `theme.css` (the token build's CSS output: light on `:root`, dark under `[data-mode="dark"]`), parsed into one
 * variable map per mode. jsdom does not evaluate component CSS, so these helpers are how a test proves the CSS reads
 * variables that exist and that they resolve to the same values as the JavaScript token tree.
 */
// Resolved from the package root (where vitest runs): `import.meta.url` is not a file URL under jsdom.
const require = createRequire(path.join(process.cwd(), "package.json"));

type Block = Map<string, string>;

function parseBlock(source: string): Block {
  const out: Block = new Map();
  for (const match of source.matchAll(/^\s*(--[\w-]+):\s*(.+?);(?:\s*\/\*\*.*\*\/)?\s*$/gm)) out.set(match[1], match[2].trim());
  return out;
}

let parsed: { light: Block; dark: Block } | undefined;

export function themeVariables(): { light: Block; dark: Block } {
  if (!parsed) {
    const css = readFileSync(require.resolve("@sragatiping/cuboid-primitives/css/theme.css"), "utf8");
    const darkAt = css.indexOf('[data-mode="dark"]');
    parsed = { light: parseBlock(css.slice(0, darkAt)), dark: parseBlock(css.slice(darkAt)) };
  }
  return parsed;
}

/** Follow `var(--a)` references to the literal value, as the browser would on an element in that mode. */
export function resolveVariable(name: string, mode: "light" | "dark"): string {
  const block = themeVariables()[mode];
  let value = block.get(name);
  for (let hops = 0; value !== undefined && hops < 20; hops++) {
    const next = value.replace(/var\((--[\w-]+)\)/g, (_, inner: string) => block.get(inner) ?? `<missing ${inner}>`);
    if (next === value) break;
    value = next;
  }
  if (value === undefined) throw new Error(`${name} is not defined in the ${mode} theme.css`);
  return value;
}

/** Every `--cube-*` variable a stylesheet reads with `var()`. */
export function cubeVariablesRead(cssSource: string): string[] {
  return [...new Set([...cssSource.matchAll(/var\((--cube-[\w-]+)\)/g)].map((match) => match[1]))].sort();
}

/** A file under the package root, e.g. `src/components/core/Button/ButtonBase.module.css`. */
export const readSource = (fromPackageRoot: string) => readFileSync(path.join(process.cwd(), fromPackageRoot), "utf8");
