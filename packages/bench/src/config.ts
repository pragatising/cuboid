import type { Fixtures } from "./engine/types";

/** A package whose components Bench shows. */
export type BenchPackage = {
  /** What an app imports it by: the name examples are written with. */
  name: string;
  /** Its folder, relative to the config file. */
  root: string;
  /** CSS a page that draws it needs (its tokens, its fonts), by the name an app imports each by: the page inside every frame loads them. */
  styles?: string[];
  /** Its entry, relative to `root`: what an app gets from importing it. */
  entry: string;
  /** What is read for its components' props and structure, relative to `root`: the module that exports them. @default `entry` */
  scan?: string;
  /** Where its components are, relative to `root`. Each lives in a folder of its own name; no story or example file is needed beside it. */
  components: string;
  /**
   * The sidebar sections its components go in, in the order they are listed. A section with a `folder` holds the components in that folder of
   * `components`; the one without holds those directly in `components`. A package with none is not shown, only available to the examples (what
   * the shown ones are built on).
   */
  sections: { id: string; label: string; folder?: string }[];
};

/** Everything Bench needs to know about the library it is showing. This file is where it is told; nothing else names the library. */
export type BenchConfig = {
  /** The packages shown, the first being the one examples are written against (what the code view imports from). */
  packages: BenchPackage[];
  /** The file that says how far along each component is, relative to the config file (a table in markdown). Without one, no component has a status. */
  tracker?: string;
  /** Where what is read from the code is written (the props, the structure, the status), relative to the config file. @default ".bench" */
  out?: string;
  /** Folders whose contents change what a check's answer is (besides each package's source), relative to the config file: the tokens. */
  watch?: string[];
  /** What code alone cannot say, which a library may add. Bench runs without any of it. */
  adapters?: {
    /** A component writes a default as a call or a lookup (`tokens.color.surface`): what it applies, in the prop's own terms (`"surface"`). Without it the default is shown as written. */
    resolveDefault?: (expression: string, prop: import("./engine/api").PropInfo) => string | undefined;
  };
  /** The words and pictures the examples engine puts in slots, and what a component needs that only an app can say. */
  fixtures: Fixtures;
};

export function defineBench(config: BenchConfig): BenchConfig {
  return config;
}
