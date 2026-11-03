import { javascript } from "@codemirror/lang-javascript";
import { highlightTree } from "@lezer/highlight";
import { describe, expect, it } from "vitest";
import { highlightSource, resolveSyntaxColors } from "../../ui/index";
import tokens from "@sragatiping/cuboid-primitives";
import { syntaxHighlighter, syntaxStyles } from "./syntax";

const code = `// A note
import { Button } from "cuboid";

function Example() {
  const total = count + 1;
  return (
    <Box gap="2x">
      <Button variant="primary" disabled onClick={() => go(1, true, null)}>Save</Button>
    </Box>
  );
}`;

/** What the editor calls each character, by the names it gives. */
function editorKeys(source: string): Map<number, string> {
  const tree = javascript({ jsx: true, typescript: true }).language.parser.parse(source);
  const keys = new Map<number, string>();
  highlightTree(tree, syntaxHighlighter, (from, to, classes) => {
    for (let i = from; i < to; i++) keys.set(i, classes.replace(/^cs-/, ""));
  });
  return keys;
}

/** What `CodeBlock`'s own tokenizer calls each token, by offset. */
function cuboidTokens(source: string) {
  const alias: Record<string, string> = { boolean: "booleanLiteral", null: "nullLiteral", number: "numberLiteral" };
  const found: { at: number; text: string; key: string }[] = [];
  let at = 0;
  for (const line of highlightSource(source, "tsx")) {
    let column = 0;
    for (const token of line.tokens) {
      if (token.value.trim()) found.push({ at: at + column, text: token.value, key: alias[token.type] ?? token.type });
      column += token.value.length;
    }
    at += line.tokens.reduce((n, t) => n + t.value.length, 0) + 1;
  }
  return found;
}

describe("colours match CodeBlock's where both say the same thing", () => {
  const editor = editorKeys(code);
  const cuboid = cuboidTokens(code);

  // What both name alike. The editor says more (storage apart from keyword, bracket depth, a tag's brackets in its tag's colour, operators),
  // and CodeBlock's tokenizer is not yet that fine, so those are checked on their own below.
  const compared = ["comment", "functionCall", "componentTag", "jsxAttribute", "string", "numberLiteral", "booleanLiteral", "nullLiteral"];

  it.each(compared)("calls a %s what Cuboid calls it", (key) => {
    // A function where it is declared CodeBlock calls a call; the editor says it is declared (`functionDeclaration`), which is checked below.
    const mine = cuboid.filter((t) => t.key === key && !(key === "functionCall" && code.slice(0, t.at).trimEnd().endsWith("function")));
    expect(mine.length, `the sample has no ${key}`).toBeGreaterThan(0);
    const wrong = mine.filter((t) => editor.get(t.at) !== key).map((t) => `${JSON.stringify(t.text)} is ${editor.get(t.at) ?? "plain"}`);
    expect(wrong).toEqual([]);
  });
});

describe("the editor's own vocabulary", () => {
  const keys = (source: string) => {
    const found: [string, string][] = [];
    const tree = javascript({ jsx: true, typescript: true }).language.parser.parse(source);
    highlightTree(tree, syntaxHighlighter, (from, to, classes) => found.push([source.slice(from, to), classes.replace(/^cs-/, "")]));
    return found;
  };
  const of = (source: string, text: string) => keys(source).find(([t]) => t === text)?.[1];

  it("calls import, export, return and the words of control flow keywords, and what declares a name its storage", () => {
    const source = `import { a } from "x";\nexport const f = (b: number) => { if (b) return typeof b; };`;
    for (const word of ["import", "from", "export", "if", "return", "typeof"]) expect(of(source, word), word).toBe("keyword");
    for (const word of ["const"]) expect(of(source, word), word).toBe("storage");
    expect(of("class A { public x = this.y; }", "public")).toBe("storage");
    expect(of("class A { public x = this.y; }", "this")).toBe("storage");
  });

  it("tells a function where it is declared from where it is called", () => {
    expect(keys("function area() {}\narea();").filter(([t]) => t === "area").map(([, k]) => k)).toEqual(["functionDeclaration", "functionCall"]);
  });

  it("tells a component from a platform element, and names the props", () => {
    const source = `<Button size="sm"><div className="x" /></Button>`;
    expect(of(source, "Button")).toBe("componentTag");
    expect(of(source, "div")).toBe("htmlTag");
    expect(of(source, "size")).toBe("jsxAttribute");
  });

  it("names types, properties, escapes, regular expressions, operators and separators", () => {
    expect(of("let x: Promise<string>;", "Promise")).toBe("typeName");
    expect(of("row.name;", "name")).toBe("propertyAccess");
    expect(of('const s = "a\\nb";', "\\n")).toBe("stringEscape");
    expect(of("const r = /a+/g;", "/a+/g")).toBe("stringRegexp");
    expect(of("a = b + c;", "+")).toBe("operator");
    expect(of("f(a, b);", ",")).toBe("punctuation");
  });

  it("leaves the brackets to syntaxMarks and does not name them", () => {
    expect(keys("f(a);").some(([text]) => text === "(")).toBe(false);
    expect(keys("<A />").some(([text]) => text === "<")).toBe(false);
  });
});

describe("the colours", () => {
  const colors = resolveSyntaxColors(tokens.light);

  it("come from the same resolution CodeBlock uses, one rule for each name", () => {
    const rules = syntaxStyles(colors);
    for (const [key, value] of Object.entries(colors)) expect(rules[`.cs-${key}`], key).toEqual({ color: value });
  });
});
