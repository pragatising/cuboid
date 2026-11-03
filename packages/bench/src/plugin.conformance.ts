// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Plugin } from "vite";
import { bench } from "./plugin";
import type { BenchConfig } from "./config";

const config = {
  packages: [
    { name: "@x/lib", root: ".", entry: "src/index.ts", components: "src/components", sections: [] },
    { name: "@x/other", root: "../other", entry: "src/index.ts", components: "src", sections: [] },
  ],
  fixtures: {},
} as unknown as BenchConfig;

const plugin = bench(config, "/repo/pkg") as Plugin & { resolveId: (id: string, importer?: string) => string | undefined; load: (id: string) => string | undefined };

describe("what an example imports", () => {
  it("is the package itself, by its entry, for an examples file too: it is compiled, and drawn with the real library", () => {
    expect(plugin.resolveId("@x/lib", "/repo/pkg/src/components/Table/Table.examples.tsx")).toBe("/repo/pkg/src/index.ts");
  });

  it("is the package itself, by its entry, for the shell and the library's own files", () => {
    expect(plugin.resolveId("@x/lib", "/repo/pkg/src/shell/Shell.tsx")).toBe("/repo/pkg/src/index.ts");
    expect(plugin.resolveId("@x/lib", undefined)).toBe("/repo/pkg/src/index.ts");
    expect(plugin.resolveId("@x/other", "/repo/pkg/src/shell/Shell.tsx")).toBe("/repo/other/src/index.ts");
  });

  it("leaves other packages to the build", () => {
    expect(plugin.resolveId("react", "/repo/pkg/src/components/Table/Table.examples.tsx")).toBeUndefined();
    expect(plugin.resolveId("@x/lib/sub", "/repo/pkg/src/a.ts")).toBeUndefined();
  });

  it("still resolves the module that holds the config and the library", () => {
    expect(plugin.resolveId("virtual:bench", "/anywhere.ts")).toBe("\0virtual:bench");
  });

  it("does not answer for ids that are not its own", () => {
    expect(plugin.load("/some/file.ts")).toBeUndefined();
  });
});
