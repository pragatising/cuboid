/**
 * A dev-only Babel plugin for the docs shell: it tags every JSX element of a story file with the lines it was written on
 * (`data-src="12-14"`, the opening tag's first and last line). A component passes unknown props to its root element, so the DOM
 * it renders carries them, and the Anatomy view can say "this box is that line of the story". It runs only on `*.stories.tsx`
 * and only in the shell's Vite config: the library, its stories in Storybook and its build never see it.
 */
type Located = { loc?: { start: { line: number }; end: { line: number } } | null };
type JsxOpening = Located & { attributes: unknown[]; name: { type: string } };

// The Babel API is passed in by the caller (plugin-react), so this file needs no `@babel/*` import.
type Types = {
  jsxAttribute: (name: unknown, value: unknown) => unknown;
  jsxIdentifier: (name: string) => unknown;
  stringLiteral: (value: string) => unknown;
  isJSXAttribute: (node: unknown) => node is { name: { name?: unknown } };
};

export function storySource({ types: t }: { types: Types }) {
  return {
    name: "cuboid-story-source",
    visitor: {
      JSXOpeningElement(path: { node: JsxOpening }, state: { filename?: string }) {
        if (!state.filename?.endsWith(".stories.tsx")) return;
        const { node } = path;
        const loc = node.loc;
        if (!loc || node.attributes.some((attribute) => t.isJSXAttribute(attribute) && attribute.name.name === "data-src")) return;
        node.attributes.push(t.jsxAttribute(t.jsxIdentifier("data-src"), t.stringLiteral(`${loc.start.line}-${loc.end.line}`)));
      },
    },
  };
}
