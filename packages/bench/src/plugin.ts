import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { transformWithEsbuild } from "vite";
import type { Plugin } from "vite";
import type { BenchConfig } from "./config";
import { outOf } from "./load";

const ID = "virtual:bench";
/** The CSS the library says a page of it needs (`styles` in the config): the page inside each frame imports this. */
const STYLES = "virtual:bench-styles";
/** The JSX runtime an example is compiled against: React's, except that it can set props on the one element a change is for (frame/document/jsx-dev-runtime.ts). */
const JSX_SOURCE = "bench-jsx";
const JSX_RUNTIME = path.resolve(__dirname, "frame/document/jsx-dev-runtime.ts");
const isExample = (importer: string | undefined) => importer !== undefined && /\.examples\.tsx(\?|$)/.test(importer);

/**
 * Tells the build where the library is, from the config: each package by its name (so an example imports it as an app does, and gets this
 * source), and `virtual:bench`, which holds what only the build can gather: the config, and the library's exports. The module is written
 * from the config and the build then reads it as any other. What is shown is derived from the code, except what someone wrote to be shown
 * as it is: a component's `Name.examples.tsx` (plain function components, one per export) is found here and offered to the Examples view.
 */
export function bench(config: BenchConfig, base: string): Plugin {
  const at = (...parts: string[]) => path.resolve(base, ...parts);
  // A package's folder, by a name the build can start from.
  const folder = (index: number) => `~bench/${index}`;

  const source = () => {
    const lines: string[] = [];
    config.packages.forEach((pkg, index) =>
      lines.push(
        `import * as library${index} from ${JSON.stringify(pkg.name)};`,
      ),
    );
    // What the config says, for the shell to read: it is plain data.
    lines.push(`export const config = ${JSON.stringify(config)};`);
    // What each package says of itself: the version it has, for the shell to show.
    const versions = Object.fromEntries(
      config.packages.map((pkg) => {
        const file = at(pkg.root, "package.json");
        return [pkg.name, existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as { version?: string }).version : undefined];
      }),
    );
    lines.push(`export const versions = ${JSON.stringify(versions)};`);
    lines.push(
      `export const library = { ${config.packages.map((_, index) => `...library${index}`).join(", ")} };`,
    );
    // The examples someone wrote, by where they are: each loads when it is asked for. A new file needs the page reloaded, not the build restarted.
    config.packages.forEach((pkg, index) =>
      lines.push(
        `const examples${index} = import.meta.glob(${JSON.stringify(`${folder(index)}/${pkg.components.replace(/^\.\//, "")}/**/*.examples.tsx`)});`,
      ),
    );
    lines.push(
      `export const examples = { ${config.packages.map((_, index) => `...examples${index}`).join(", ")} };`,
    );
    // Their text too: a module's exports have no order of their own, so the order they are written in is read from the file.
    config.packages.forEach((pkg, index) =>
      lines.push(
        `const exampleSources${index} = import.meta.glob(${JSON.stringify(`${folder(index)}/${pkg.components.replace(/^\.\//, "")}/**/*.examples.tsx`)}, { query: "?raw", import: "default" });`,
      ),
    );
    lines.push(
      `export const exampleSources = { ${config.packages.map((_, index) => `...exampleSources${index}`).join(", ")} };`,
    );
    // The source of every component's folder (not its tests, stories or examples): what the Component view shows, a file to a tab.
    config.packages.forEach((pkg, index) => {
      const root = `${folder(index)}/${pkg.components.replace(/^\.\//, "")}`;
      lines.push(
        `const sources${index} = import.meta.glob(${JSON.stringify([`${root}/**/*.{ts,tsx,css}`, `!${root}/**/*.{test,test-d,stories,examples,generated}.{ts,tsx}`])}, { query: "?raw", import: "default" });`,
      );
    });
    lines.push(
      `export const sources = { ${config.packages.map((_, index) => `...sources${index}`).join(", ")} };`,
    );
    return lines.join("\n");
  };

  return {
    name: "bench",
    // Before the build's own resolver, which would find a package by its name in node_modules (a built copy, or none) before this is asked.
    enforce: "pre",
    config: () => ({
      resolve: {
        alias: [
          ...config.packages.map((pkg, index) => ({
            find: new RegExp(`^${folder(index)}/`),
            replacement: `${at(pkg.root)}/`,
          })),
          // What was read from the code (props, structure, status), where the config says it is written.
          {
            find: /^~bench\/generated\//,
            replacement: `${outOf(config, base)}/`,
          },
        ],
      },
      server: {
        fs: {
          allow: [
            ...config.packages.map((pkg) => at(pkg.root)),
            outOf(config, base),
          ],
        },
      },
    }),
    resolveId(id, importer) {
      if (id === ID) return `\0${ID}`;
      if (id === STYLES) return `\0${STYLES}`;
      // What the page imports for its styles is found from the config, as the library is: not from Bench's own folder.
      if (importer === `\0${STYLES}`) {
        const found = (this as unknown as { resolve?: (id: string, from: string, options: object) => Promise<{ id: string } | null> } | undefined)?.resolve?.(id, at("package.json"), { skipSelf: true });
        return found?.then((resolved) => resolved?.id) as unknown as string | undefined;
      }
      // A package is found by the name an app imports it by: here, not in an alias, which would answer before this could see who is asking.
      const index = config.packages.findIndex((pkg) => pkg.name === id);
      if (index < 0) return undefined;
      return at(config.packages[index].root, config.packages[index].entry);
    },
    load: (id) => {
      if (id === `\0${ID}`) return source();
      if (id === `\0${STYLES}`) return config.packages.flatMap((pkg) => pkg.styles ?? []).map((style) => `import ${JSON.stringify(style)};`).join("\n");
      return undefined;
    },
  };
}

/**
 * Compiles each `*.examples.tsx` against Bench's own JSX runtime, in development, so every element an example writes is made with the place it is written (the
 * line and column of its `<`). That is how a page drawing the real example finds the one element a change in the pane is for, among several written alike. It runs
 * before Vite's own transform of the file; the library's files are not touched, and the output is the example, compiled, as it would be.
 */
export function benchJsx(): Plugin {
  return {
    name: "bench-jsx",
    enforce: "pre",
    resolveId: (id) => (id === `${JSX_SOURCE}/jsx-dev-runtime` ? JSX_RUNTIME : undefined),
    async transform(code, id) {
      if (!isExample(id)) return undefined;
      const file = id.split("?")[0];
      const result = await transformWithEsbuild(code, file, { loader: "tsx", jsx: "automatic", jsxDev: true, jsxImportSource: JSX_SOURCE, sourcemap: true });
      return { code: result.code, map: result.map };
    },
  };
}
