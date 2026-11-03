/// <reference types="vite/client" />

/** A fingerprint of what a check's answer depends on (sourceHash.ts). */
declare module "virtual:source-hash" {
  const hash: string;
  export default hash;
}

/** What only the build can gather about the library (plugin.ts), as `bench.config.ts` describes it. */
declare module "virtual:bench" {
  /** The config, as it was written. */
  export const config: import("./config").BenchConfig;
  /** The version each package says it has, by its name. */
  export const versions: Record<string, string | undefined>;
  /** Every package's exports, by name: what an example can use. */
  export const library: Record<string, unknown>;
  /** The `*.examples.tsx` files, by path: each loads to its exports, the examples someone wrote. */
  export const examples: Record<string, () => Promise<Record<string, unknown>>>;
  /** The same files as text, by the same paths: what gives the examples their order. */
  export const exampleSources: Record<string, () => Promise<string>>;
  /** The source of the files in every component's folder (tests, stories and examples left out), by path: each loads to its text. */
  export const sources: Record<string, () => Promise<string>>;
}

/** The CSS the library says a page that draws it needs (its tokens, its fonts): imported by the page inside each frame. */
declare module "virtual:bench-styles" {}
