/**
 * A dev-only Babel plugin for the docs shell: it tags every JSX element of a story file with where it was written
 * (`data-src="21:8-21:51;23:8-23:17"`: `line:column` where the opening tag starts and ends, then the same for the closing tag
 * when there is one). A component passes unknown props to its root element, so the DOM it renders carries them, and the
 * Anatomy view can say "this box is exactly this piece of the story". It runs only on `*.stories.tsx` and `*.examples.tsx` and only in the shell's
 * Vite config: the library, its stories in Storybook and its build never see it.
 */
type Loc = {
  start: { line: number; column: number };
  end: { line: number; column: number };
};
type Located = { loc?: Loc | null };
type JsxOpening = Located & { attributes: unknown[]; name: { type: string } };
type JsxElementParent = { closingElement?: Located | null };

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
      JSXOpeningElement(
        path: { node: JsxOpening; parent: JsxElementParent },
        state: { filename?: string },
      ) {
        if (!/\.(stories|examples)\.tsx$/.test(state.filename ?? "")) return;
        const { node } = path;
        const loc = node.loc;
        if (
          !loc ||
          node.attributes.some(
            (attribute) =>
              t.isJSXAttribute(attribute) && attribute.name.name === "data-src",
          )
        )
          return;
        const range = ({ start, end }: Loc) =>
          `${start.line}:${start.column}-${end.line}:${end.column}`;
        const closing = path.parent.closingElement?.loc;
        node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier("data-src"),
            t.stringLiteral(
              closing ? `${range(loc)};${range(closing)}` : range(loc),
            ),
          ),
        );
      },
    },
  };
}
