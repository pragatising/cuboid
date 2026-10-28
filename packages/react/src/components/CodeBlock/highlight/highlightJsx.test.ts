import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { contrastRatio } from "../../../test/contrast";
import { highlightSource } from "./index";

/** The `type value` of every token on every line, so a test reads the colours as a sentence. */
const typed = (code: string, language: "tsx" | "jsx" = "tsx") => highlightSource(code, language).flatMap((line) => line.tokens.map((token) => `${token.type} ${token.value}`));

describe("JSX highlighting: tags", () => {
  it("gives the opening and the closing tag of an element the same colours", () => {
    expect(typed("<ActionMenu.Item>Duplicate</ActionMenu.Item>")).toEqual([
      "tagBracket <",
      "componentTag ActionMenu.Item",
      "tagBracket >",
      "jsxText Duplicate",
      "tagBracket </",
      "componentTag ActionMenu.Item",
      "tagBracket >",
    ]);
  });

  it("colours a component and a platform element differently, each the same at both ends", () => {
    const tokens = typed("<Button>a</Button><div>b</div>");
    expect(tokens).toContain("componentTag Button");
    expect(tokens.filter((t) => t === "componentTag Button")).toHaveLength(2);
    expect(tokens.filter((t) => t === "entityTag div")).toHaveLength(2);
  });

  it("colours props, strings and the equals sign inside a tag, and the end of a self-closing tag", () => {
    expect(typed('<Icon name="star" size={16} />')).toEqual([
      "tagBracket <",
      "componentTag Icon",
      "plain  ",
      "jsxAttribute name",
      "operator =",
      "string \"star\"",
      "plain  ",
      "jsxAttribute size",
      "operator =",
      "bracket {",
      "number 16",
      "bracket }",
      "plain  ",
      "tagBracket />",
    ]);
  });

  it("handles fragments", () => {
    expect(typed("<>x</>")).toEqual(["tagBracket <", "tagBracket >", "jsxText x", "tagBracket </", "tagBracket >"]);
  });
});

describe("JSX highlighting: text and code", () => {
  it("does not read the text between tags as code", () => {
    // `Edit` would be a typeName, and the `<` after it a generic, if it were read as code.
    const tokens = typed("<A>Edit</A>");
    expect(tokens).toContain("jsxText Edit");
    expect(tokens.some((t) => t.startsWith("typeName"))).toBe(false);
    expect(tokens.filter((t) => t === "componentTag A")).toHaveLength(2);
  });

  it("carries the children mode across lines, and nested elements", () => {
    const tokens = typed(["<Menu>", "  <Menu.Item>Edit</Menu.Item>", "  Some text", "</Menu>"].join("\n"));
    expect(tokens.filter((t) => t === "componentTag Menu")).toHaveLength(2);
    expect(tokens.filter((t) => t === "componentTag Menu.Item")).toHaveLength(2);
    expect(tokens.some((t) => t.startsWith("jsxText") && t.includes("Some text"))).toBe(true);
  });

  it("reads a {expression} child as code, and goes back to text after it", () => {
    const tokens = typed("<p>{count} items</p>");
    expect(tokens).toContain("plain count");
    expect(tokens).toContain("jsxText  items");
  });

  it("keeps nested braces balanced, so `style={{ a: 1 }}` does not end the tag early", () => {
    const tokens = typed('<Box style={{ opacity: 1 }}>x</Box>');
    expect(tokens.filter((t) => t === "componentTag Box")).toHaveLength(2);
    expect(tokens).toContain("jsxText x");
  });

  it("returns to code after the element is closed", () => {
    const tokens = typed(["const a = (", "  <A>x</A>", ");", "const b = 1;"].join("\n"));
    expect(tokens.some((t) => t.startsWith("jsxText") && t.includes(");"))).toBe(false);
    expect(tokens).toContain("number 1");
  });

  it("still reads a generic as a generic, and a comparison is not a tag", () => {
    expect(typed("const x = useState<string>(null);")).not.toContain("tagBracket <");
    expect(typed("const x = useState<string>(null);").some((t) => t.startsWith("jsxText"))).toBe(false);
  });

  it("does the same in jsx", () => {
    expect(typed("<A>t</A>", "jsx").filter((t) => t === "componentTag A")).toHaveLength(2);
  });
});

describe.each(["light", "dark"] as const)("JSX syntax colours, %s", (mode) => {
  const { syntax, bgColor } = tokens[mode];
  it.each(["componentTag", "tagBracket", "jsxText", "jsxAttribute"] as const)("%s is at least 4.5:1 on the code surface", (key) => {
    expect(contrastRatio(syntax.typescript[key], bgColor.canvas.subtle)).toBeGreaterThanOrEqual(4.5);
  });
});
