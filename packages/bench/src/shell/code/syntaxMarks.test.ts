import { javascript } from "@codemirror/lang-javascript";
import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { BRACKET_LEVELS, syntaxDecorations } from "./syntaxMarks";

/** What each marked piece of the text is called, in order of position. */
function marked(source: string): [string, string][] {
  const state = EditorState.create({ doc: source, extensions: [javascript({ jsx: true, typescript: true })] });
  ensureSyntaxTree(state, state.doc.length, 5000);
  const found: [number, string, string][] = [];
  syntaxDecorations(state).between(0, source.length, (from, to, value) => void found.push([from, source.slice(from, to), String(value.spec.class).replace(/^cs-/, "")]));
  return found.sort((a, b) => a[0] - b[0]).map(([, text, name]) => [text, name]);
}

describe("brackets take the colour of their depth", () => {
  it("colours a pair alike and the next level differently", () => {
    expect(marked("f(a[0]);")).toEqual([
      ["(", "bracketLevel1"],
      ["[", "bracketLevel2"],
      ["]", "bracketLevel2"],
      [")", "bracketLevel1"],
    ]);
  });

  it("does not make a pair out of a different kind: parentheses, square and curly brackets share one count", () => {
    const names = marked("const x = { a: [(1)] };").map(([, name]) => name);
    expect(names).toEqual(["bracketLevel1", "bracketLevel2", "bracketLevel3", "bracketLevel3", "bracketLevel2", "bracketLevel1"]);
  });

  it("repeats the colours after the last level", () => {
    const names = marked("((((a))))").map(([, name]) => name);
    expect(names).toEqual(["bracketLevel1", "bracketLevel2", "bracketLevel3", "bracketLevel1", "bracketLevel1", "bracketLevel3", "bracketLevel2", "bracketLevel1"]);
    expect(BRACKET_LEVELS).toBe(3);
  });

  it("starts each part of the code from its own depth: a bracket closed is a level given back", () => {
    expect(marked("f(); g();").map(([, name]) => name)).toEqual(["bracketLevel1", "bracketLevel1", "bracketLevel1", "bracketLevel1"]);
  });

  it("counts a JSX expression's braces, and not a tag's angle brackets", () => {
    const names = marked('<A b={f(1)} />').filter(([text]) => /^[(){}]$/.test(text)).map(([, name]) => name);
    expect(names).toEqual(["bracketLevel1", "bracketLevel2", "bracketLevel2", "bracketLevel1"]);
  });

  it("never goes below the first level on a stray closing bracket", () => {
    expect(marked(")").map(([, name]) => name)).toEqual(["bracketLevel1"]);
  });
});

describe("a tag's brackets are the colour of the tag", () => {
  it("is a component's colour for a component, in the opening, the closing and the self-closing tag", () => {
    const parts = marked("<Box><Icon /></Box>").filter(([text]) => /^[<>/]+$/.test(text));
    expect(parts.map(([, name]) => name)).toEqual(Array(parts.length).fill("componentTag"));
    expect(parts.map(([text]) => text)).toEqual(["<", ">", "<", "/>", "</", ">"]);
  });

  it("is a platform element's colour for an element", () => {
    const parts = marked("<div><span /></div>").filter(([text]) => /^[<>/]+$/.test(text));
    expect(new Set(parts.map(([, name]) => name))).toEqual(new Set(["htmlTag"]));
  });

  it("is each tag's own in a mix: a component in an element, an element in a component", () => {
    expect(marked("<div><Box /></div>").filter(([text]) => /^[<>/]+$/.test(text)).map(([, name]) => name)).toEqual(["htmlTag", "htmlTag", "componentTag", "componentTag", "htmlTag", "htmlTag"]);
  });

  it("is a member component's colour for `Table.Cell`", () => {
    expect(marked("<Table.Cell>x</Table.Cell>").filter(([text]) => /^[<>/]+$/.test(text)).map(([, name]) => name)).toEqual(Array(4).fill("componentTag"));
  });

  it("colours the dot of a member name as the name, in the opening and the closing tag", () => {
    const dots = marked("<Table.Cell>x</Table.Cell>").filter(([text]) => text === ".");
    expect(dots.map(([, name]) => name)).toEqual(["componentTag", "componentTag"]);
  });

  it("gives a fragment, which has no name, the quiet tag-bracket colour", () => {
    expect(marked("<>x</>").filter(([text]) => /^[<>/]+$/.test(text)).map(([, name]) => name)).toEqual(Array(4).fill("tagBracket"));
  });
});

describe("a template literal's expression", () => {
  it("marks the `${` and the `}` that close it, and does not count them as brackets", () => {
    expect(marked("`a ${b} c`")).toEqual([
      ["${", "templateInterpolation"],
      ["}", "templateInterpolation"],
    ]);
  });
});
