import type { BenchConfig } from "@sragatiping/bench";
import { resolveDefault } from "./bench/resolveDefault";

/** Cuboid, and the editor beside it, as Bench shows them. */
export default {
  packages: [
    {
      name: "@sragatiping/cuboid",
      root: ".",
      entry: "src/index.ts",
      // What a page that draws the library needs: its tokens and its icon fonts.
      styles: ["@sragatiping/cuboid-primitives/css/theme.css", "@sragatiping/cuboid-primitives/icons/icon-fonts.css"],
      components: "src/components",
      sections: [
        { id: "core", label: "Core", folder: "core" },
        { id: "other", label: "Data and code" },
      ],
    },
    {
      name: "@sragatiping/cuboid-editor",
      root: "../editor",
      entry: "src/index.ts",
      // What is documented is its components, not everything it exports (its blocks, its helpers).
      scan: "src/Editor/index.ts",
      components: "src",
      sections: [{ id: "editor", label: "Editor" }],
    },
  ],
  adapters: { resolveDefault },
  tracker: "../../docs/backlog/react-migration-tracker.md",
  watch: ["../primitives/src/tokens"],
  fixtures: {
    labels: {
      short: "Save changes",
      long: "Save all changes and continue to the next step",
    },
    fillers: {
      leadingVisual: { tag: "Icon", props: { name: "add" } },
      trailingVisual: { tag: "Icon", props: { name: "arrow_forward" } },
      // IconButton's whole content: it is an icon, not a label.
      icon: { tag: "Icon", props: { name: "add" } },
    },
    // An icon-only button is named by what the caller says it does, and nothing in its types says so: the library warns "pass `aria-label`".
    // A divider is a line between two groups: it takes children as any element does, and nobody puts text in one.
    empty: ["Header.Divider"],
    // The components that are one control, for where a slot must be one (a menu's trigger): a pill becomes one with `as`.
    controls: {
      Button: null,
      IconButton: null,
      Link: null,
      Pill: { as: "button" },
    },
    attributes: {
      IconButton: { "aria-label": "Add" },
      // An icon is its name: nothing in the types can say which of the hundreds to draw.
      Icon: { name: "add" },
      TileIcon: { name: "add" },
      EmptyState: { icon: "inbox" },
      // What a component needs and only an app can say: the keys of a shortcut, a tooltip's words, a block of code.
      KeybindingHint: { keys: "Mod+K" },
      // The words of a tooltip that names its trigger are the trigger's own (WCAG 2.5.3: the visible text is part of the name).
      Tooltip: { text: "Trigger" },
      CodeBlock: { code: "const total = items.length;" },
      // Which page to show is the app's to say.
      SmartCard: { url: "https://example.com" },
    },
  },
} satisfies BenchConfig;
