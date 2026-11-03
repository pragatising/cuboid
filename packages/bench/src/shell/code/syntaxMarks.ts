import { syntaxTree } from "@codemirror/language";
import type { EditorState, Range } from "@codemirror/state";
import { Decoration, ViewPlugin } from "@codemirror/view";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";

const OPEN = new Set(["(", "[", "{"]);
const CLOSE = new Set([")", "]", "}"]);
/** How many levels of bracket colour there are: the colours repeat after these. */
export const BRACKET_LEVELS = 3;

const TAG_PARTS = ["JSXStartTag", "JSXEndTag", "JSXSelfCloseEndTag", "JSXStartCloseTag"];
const TAGS = new Set(["JSXOpenTag", "JSXSelfClosingTag", "JSXCloseTag", "JSXFragmentTag"]);
const NAMES = ["JSXIdentifier", "JSXMemberExpression", "JSXNamespacedName", "JSXBuiltin"];

const mark = (name: string) => Decoration.mark({ class: `cs-${name}` });
const marks = { level: Array.from({ length: BRACKET_LEVELS }, (_, i) => mark(`bracketLevel${i + 1}`)), componentTag: mark("componentTag"), htmlTag: mark("htmlTag"), tagBracket: mark("tagBracket"), interpolation: mark("templateInterpolation") };

/**
 * The colours the grammar alone cannot give, from the syntax tree:
 *   - a bracket takes the colour of its depth, so a `(` is found by its partner's colour; the colours repeat every three levels (JSX tags
 *     and the `${` of a template do not count as brackets);
 *   - the `<`, `</`, `>` and `/>` of a tag are the colour of the tag's name, a component's or a platform element's, so a tag reads as one piece
 *     (a tag with no name, a fragment, has the quiet tag-bracket colour).
 * The whole document is walked: the text in an editor like this is a snippet, not a file.
 */
export function syntaxDecorations(state: EditorState): DecorationSet {
  const found: Range<Decoration>[] = [];
  let depth = 0;
  syntaxTree(state).iterate({
    enter(node) {
      if (TAGS.has(node.name)) {
        const name = NAMES.map((child) => node.node.getChild(child)).find(Boolean);
        const colour = name ? (name.name === "JSXBuiltin" ? marks.htmlTag : marks.componentTag) : marks.tagBracket;
        for (let child = node.node.firstChild; child; child = child.nextSibling) if (TAG_PARTS.includes(child.name)) found.push(colour.range(child.from, child.to));
        // The dot of `Table.Cell` is part of the name, not an operator between two.
        if (name?.name === "JSXMemberExpression") for (let part = name.firstChild; part; part = part.nextSibling) if (part.name === ".") found.push(colour.range(part.from, part.to));
        return;
      }
      if (node.name === "InterpolationStart" || node.name === "InterpolationEnd") {
        found.push(marks.interpolation.range(node.from, node.to));
        return;
      }
      if (node.to - node.from !== 1) return;
      const text = node.name;
      if (OPEN.has(text)) found.push(marks.level[depth++ % BRACKET_LEVELS].range(node.from, node.to));
      else if (CLOSE.has(text)) found.push(marks.level[Math.max(0, --depth) % BRACKET_LEVELS].range(node.from, node.to));
    },
  });
  return Decoration.set(found, true);
}

/** The decorations above, kept as the text and its tree change. */
export const syntaxMarks = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: { state: EditorState }) {
      this.decorations = syntaxDecorations(view.state);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || syntaxTree(update.state) !== syntaxTree(update.startState)) this.decorations = syntaxDecorations(update.state);
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
