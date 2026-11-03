import { describe, expect, it } from "vitest";
import { config } from "virtual:bench";
import { buildNav } from "./nav";

describe("the sidebar", () => {
  it("lists what a package exports, in its package's section: Cuboid's in Core, the editor's in Editor", () => {
    const nav = buildNav();
    expect(
      nav.find((s) => s.id === "core")?.items.map((i) => i.name),
    ).toContain("Button");
    expect(
      nav.find((s) => s.id === "editor")?.items.map((i) => i.name),
    ).toContain("Editor");
  });

  it("reads a component's section from where its source is, whatever files sit beside it", () => {
    const declared = {
      Button: "src/components/core/Button/Button.tsx#Button",
      CodeBlock: "src/components/CodeBlock/CodeBlock.tsx#CodeBlock",
      Stray: "src/components/core/Stray.tsx#Stray",
      Editor: "../editor/src/Editor/Editor.tsx#Editor",
    };
    expect(
      buildNav(config.packages, declared).map((s) => [
        s.id,
        s.items.map((i) => i.name),
      ]),
    ).toEqual([
      ["core", ["Button"]],
      ["other", ["CodeBlock"]],
      ["editor", ["Editor"]],
    ]);
  });

  it("works from a package that is not the first, as the editor's own config is", () => {
    const editor = {
      name: "e",
      root: ".",
      entry: "src/index.ts",
      components: "src",
      sections: [{ id: "editor", label: "Editor" }],
    };
    const cuboid = {
      name: "c",
      root: "../react",
      entry: "src/index.ts",
      components: "src/components",
      sections: [],
    };
    expect(
      buildNav([editor, cuboid], {
        Editor: "src/Editor/Editor.tsx#Editor",
        Button: "../react/src/components/core/Button/Button.tsx#Button",
      }),
    ).toEqual([{ id: "editor", label: "Editor", items: [{ name: "Editor" }] }]);
  });
});
