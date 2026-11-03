import type { BenchConfig } from "@sragatiping/bench";
import cuboid from "../react/bench.config";

/**
 * The editor in Bench, on its own: the editor is the package shown, and Cuboid is what it is built on, so its components are there for the
 * examples to use and its props to be read, but it is not listed. The words and pictures that fill slots are Cuboid's own.
 */
export default {
  packages: [
    {
      name: "@sragatiping/cuboid-editor",
      root: ".",
      entry: "src/index.ts",
      scan: "src/Editor/index.ts",
      components: "src",
      sections: [{ id: "editor", label: "Editor" }],
    },
    { ...cuboid.packages[0], root: "../react", sections: [] },
  ],
  watch: ["../primitives/src/tokens"],
  fixtures: cuboid.fixtures,
} satisfies BenchConfig;
