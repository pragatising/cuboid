import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import type { DocNode } from "../core";
import { Read } from "./Read";

const doc: DocNode = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
    { type: "paragraph", content: [{ type: "text", text: "a " }, { type: "text", text: "bold", marks: [{ type: "bold" }] }, { type: "text", text: " word" }] },
    { type: "callout", attrs: { color: "yellow", bordered: true }, content: [{ type: "paragraph", content: [{ type: "text", text: "careful" }] }] },
    { type: "divider" },
    { type: "mystery", content: [{ type: "text", text: "kept" }] },
  ],
};

describe("Read", () => {
  it("draws text, marks and registered blocks from the same JSON the editor writes", () => {
    const { container } = render(<Read node={doc} />);
    expect(container.querySelector("h2")?.textContent).toBe("Title");
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector('[data-component="Callout"]')?.textContent).toBe("careful");
    expect(container.querySelector("hr")).not.toBeNull();
  });

  it("shows a node it has no block for, with its content, instead of dropping it", () => {
    const { container } = render(<Read node={doc} />);
    expect(container.querySelector('[data-unknown-block="mystery"]')?.textContent).toBe("kept");
  });

  it("fills in a block's default attrs when the document omits them", () => {
    const { container } = render(<Read node={{ type: "doc", content: [{ type: "callout", content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }] }] }} />);
    expect(container.querySelector('[data-component="Callout"]')).not.toBeNull();
  });
});

describe("Read marks", () => {
  const withMarks = (marks: DocNode["marks"]): DocNode => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks }] }] });
  const html = (marks: DocNode["marks"]) => render(<Read node={withMarks(marks)} />).container;

  it("draws underline and strikethrough", () => {
    expect(html([{ type: "underline" }]).querySelector("u")?.textContent).toBe("x");
    expect(html([{ type: "strike" }]).querySelector("s")?.textContent).toBe("x");
  });

  it("draws a chip as a span the stylesheet sets on a quiet ground", () => {
    expect(html([{ type: "chip" }]).querySelector("span[data-chip]")?.textContent).toBe("x");
  });

  it("draws a palette colour through Cuboid's variable, and ignores a colour that is not in the palette", () => {
    expect(html([{ type: "textColor", attrs: { color: "danger.strong" } }]).querySelector("span")?.getAttribute("style")).toContain("--cube-fgColor-danger-strong");
    expect(html([{ type: "textColor", attrs: { color: "red; background:url(x)" } }]).querySelector("span")).toBeNull();
  });

  it("draws a highlight with Cuboid's Highlight, falling back to yellow for a name it does not know", () => {
    expect(html([{ type: "highlight", attrs: { color: "blue" } }]).querySelector('[data-component="Highlight"]')?.textContent).toBe("x");
    expect(html([{ type: "highlight", attrs: { color: "nope" } }]).querySelector('[data-component="Highlight"]')).not.toBeNull();
  });

  it("draws a safe link with a safe rel, and a javascript: link as plain text", () => {
    const safe = html([{ type: "link", attrs: { href: "example.com" } }]).querySelector("a");
    expect(safe?.getAttribute("href")).toBe("https://example.com");
    expect(safe?.getAttribute("rel")).toContain("noopener");
    expect(html([{ type: "link", attrs: { href: "javascript:alert(1)" } }]).querySelector("a")).toBeNull();
  });
});

describe("Read inline atoms", () => {
  const inline = (...content: DocNode[]) => render(<Read node={{ type: "doc", content: [{ type: "paragraph", content }] }} />).container;

  it("draws a pill with Cuboid's Pill, and a date as text: the day, formatted", () => {
    const c = inline({ type: "pill", attrs: { label: "Shipped", shade: "green", intensity: "bold", bordered: true } }, { type: "date", attrs: { iso: "2026-11-12" } });
    const pills = c.querySelectorAll('[data-component="Pill"]');
    expect(pills).toHaveLength(1);
    expect(pills[0].textContent).toBe("Shipped");
    const date = c.querySelector("span[data-date]");
    expect(date?.textContent).toMatch(/2026/);
    // Text, not a control and not a pill: it is not pressed in Read.
    expect(date?.closest("button")).toBeNull();
    expect(date?.closest('[data-component="Pill"]')).toBeNull();
  });

  it("falls back to a plain pill for a colour Cuboid does not have, and shows an invalid date as written", () => {
    const c = inline({ type: "pill", attrs: { label: "x", shade: "pink", intensity: "heavy" } }, { type: "date", attrs: { iso: "soon" } });
    expect(c.querySelectorAll('[data-component="Pill"]')).toHaveLength(1);
    expect(c.querySelector("span[data-date]")?.textContent).toBe("soon");
  });
});

describe("Read structure", () => {
  const read = (...content: DocNode[]) => render(<Read node={{ type: "doc", content }} />).container;
  const p = (value: string): DocNode => ({ type: "paragraph", content: [{ type: "text", text: value }] });

  it("draws lists, with a numbered list starting where it says", () => {
    const c = read(
      { type: "bulletList", content: [{ type: "listItem", content: [p("a")] }, { type: "listItem", content: [p("b")] }] },
      { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [p("c")] }] },
    );
    expect([...c.querySelectorAll("ul > li")].map((li) => li.textContent)).toEqual(["a", "b"]);
    expect(c.querySelector("ol")?.getAttribute("start")).toBe("3");
  });

  it("draws a quote", () => {
    expect(read({ type: "blockquote", content: [p("said")] }).querySelector("blockquote")?.textContent).toBe("said");
  });

  it("draws columns side by side, each with its share", () => {
    const c = read({ type: "columns", content: [{ type: "column", attrs: { flex: 2 }, content: [p("wide")] }, { type: "column", attrs: { flex: 1 }, content: [p("narrow")] }] });
    const columns = c.querySelectorAll("[data-column]");
    expect(columns).toHaveLength(2);
    expect((columns[0] as HTMLElement).style.flex).toMatch(/^2 1 0/);
    expect((c.querySelector('[data-component="Columns"]') as HTMLElement).style.display).toBe("flex");
  });

  it("draws code with Cuboid's CodeBlock, one line per line, in the language it names", () => {
    const c = read({ type: "codeBlock", attrs: { language: "typescript" }, content: [{ type: "text", text: "const a = 1;\nconst b = 2;" }] });
    expect(c.querySelector('[aria-label="Code"]')).not.toBeNull();
    expect(c.textContent).toContain("const a = 1;");
    expect(c.textContent).toContain("const b = 2;");
  });

  it("draws code in a language Cuboid cannot colour as plain text", () => {
    const c = read({ type: "codeBlock", attrs: { language: "cobol" }, content: [{ type: "text", text: "MOVE 1 TO X" }] });
    expect(c.textContent).toContain("MOVE 1 TO X");
  });

  it("needs no registry for the blocks every document has", () => {
    const c = read({ type: "callout", content: [{ type: "paragraph", content: [{ type: "text", text: "n" }] }] }, { type: "divider" });
    expect(c.querySelector('[data-component="Callout"]')).not.toBeNull();
    expect(c.querySelector("hr")).not.toBeNull();
  });
});

describe("the editor stylesheet, over Cuboid's Prose (whose tokens core tests)", () => {
  const css = readFileSync(resolve(__dirname, "../styles/Inline.module.css"), "utf8");
  const rule = (selector: RegExp) => selector.exec(css)?.[1] ?? "";

  it("makes the placeholder's surface the block itself, with the small radius, adding nothing to its box", () => {
    const surface = rule(/\.ProseMirror\) :is\(p:global\(\.is-empty\), p:has\(\.cuboid-slash\)\) \{([^}]*)\}/);
    expect(surface).toMatch(/background:\s*var\(--cube-bgColor-canvas-inset\)/);
    expect(surface).toMatch(/border-radius:\s*var\(--cube-borderRadius-sm\)/);
    expect(surface).not.toMatch(/margin|padding|height|position/);
  });
});

describe("the selected block's overlay", () => {
  const css = readFileSync(resolve(__dirname, "../Editor/EditorSurface/EditorSurface.module.css"), "utf8");

  it("is a tint over the block, past its edge, multiplied, with the portfolio's radius, and never over an inline atom", () => {
    const overlay = /ProseMirror-selectednode\):not\(span\)::after \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(overlay).toMatch(/inset:\s*calc\(-1 \* var\(--cube-size-4px\)\)/);
    expect(overlay).toMatch(/border-radius:\s*var\(--cube-borderRadius-md\)/);
    expect(overlay).toMatch(/mix-blend-mode:\s*multiply/);
    expect(overlay).toMatch(/--cube-highlight-blue-bgColor/);
    expect(overlay).toMatch(/pointer-events:\s*none/);
  });
});

describe("Read headings", () => {
  it.each([1, 2, 3, 4, 5, 6])("draws a level %i heading as an h%i", (level) => {
    const { container } = render(<Read node={{ type: "doc", content: [{ type: "heading", attrs: { level }, content: [{ type: "text", text: "t" }] }] }} />);
    expect(container.querySelector(`h${level}`)?.textContent).toBe("t");
  });
});

describe("a date", () => {
  const css = readFileSync(resolve(__dirname, "../styles/Inline.module.css"), "utf8");
  const rule = (selector: RegExp) => selector.exec(css)?.[1] ?? "";

  it("reads as text, as tall as its line, with no ground until it can be pressed", () => {
    const base = rule(/\.Inline \[data-date\] \{([^}]*)\}/);
    expect(base).toMatch(/background:\s*transparent/);
    expect(base).toMatch(/line-height:\s*inherit/);
    expect(base).toMatch(/display:\s*inline-block/);
    expect(base).not.toMatch(/(^|[\s;])height:/);
    expect(base).toMatch(/font:\s*inherit/);
  });

  it("shows a ground, a full line tall, when it is hovered or its editor is open, and a focus ring when focused", () => {
    expect(rule(/button\[data-date\]:is\(:hover, \[aria-expanded="true"\]\) \{([^}]*)\}/)).toMatch(/--cube-bgColor-canvas-inset/);
    expect(rule(/button\[data-date\]:focus-visible \{([^}]*)\}/)).toMatch(/--cube-focusRing-width/);
  });
});

describe("what can be pressed in the editor", () => {
  const css = readFileSync(resolve(__dirname, "../styles/Inline.module.css"), "utf8");

  it("shows a pointer on a date, in the editor only (a Pill as a button has its own)", () => {
    const rule = /\.ProseMirror\) button\[data-date\] \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(rule).toMatch(/cursor:\s*pointer/);
  });
});

describe("the gap between columns", () => {
  it("is 4x (32px) in the editor and in Read", () => {
    expect(readFileSync(resolve(__dirname, "../write/columns/ColumnsView.module.css"), "utf8")).toMatch(/gap:\s*var\(--cube-size-32px\)/);
    const { container } = render(<Read node={{ type: "doc", content: [{ type: "columns", content: [{ type: "column", content: [{ type: "paragraph" }] }, { type: "column", content: [{ type: "paragraph" }] }] }] }} />);
    expect((container.querySelector('[data-component="Columns"]') as HTMLElement).style.gap).toBe("var(--cube-size-32px)");
  });
});

describe("a colour on a chip", () => {
  const withMarks = (marks: DocNode["marks"]): DocNode => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks }] }] });

  it("reaches the chip, whichever mark is outside: the colour sets the variable the chip reads", () => {
    for (const marks of [[{ type: "chip" }, { type: "textColor", attrs: { color: "danger.strong" } }], [{ type: "textColor", attrs: { color: "danger.strong" } }, { type: "chip" }]]) {
      const { container } = render(<Read node={withMarks(marks)} />);
      const colored = container.querySelector("span[style]") as HTMLElement;
      expect(colored.getAttribute("style")).toContain("--editor-chip-color");
      expect(colored.getAttribute("style")).toContain("--cube-fgColor-danger-strong");
      expect(container.querySelector("span[data-chip]")).not.toBeNull();
    }
  });

  it("is what the chip's text is drawn in", () => {
    const css = readFileSync(resolve(__dirname, "../styles/Inline.module.css"), "utf8");
    expect(/\[data-chip\] \{([^}]*)\}/.exec(css)?.[1]).toMatch(/color:\s*var\(--editor-chip-color,/);
  });
});

describe("Read marks its registered blocks as the editor does", () => {
  it("wraps each in an element the stylesheet spaces, so a divider has the same gap above it in Read as in the editor", () => {
    const { container } = render(<Read node={{ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "a" }] }, { type: "divider" }, { type: "callout", content: [{ type: "paragraph" }] }, { type: "mystery" }] }} />);
    const root = container.querySelector('[data-component="Read"]')!;
    expect([...root.children].map((c) => c.getAttribute("data-block"))).toEqual([null, "divider", "callout", "mystery"]);
  });
});

describe("an image", () => {
  it("is read as Cuboid's Image: the picture, at its width, with its caption, and no editing", () => {
    const { container } = render(<Read node={{ type: "doc", content: [{ type: "image", attrs: { src: "https://example.com/a.png", alt: "A chart", caption: "Q3", width: 60, bordered: false } }] }} />);
    const picture = container.querySelector("img")!;
    expect(picture).toHaveAttribute("src", "https://example.com/a.png");
    expect(picture).toHaveAttribute("alt", "A chart");
    expect((picture.parentElement as HTMLElement).style.width).toBe("60%");
    expect(container.querySelector("figcaption")).toHaveTextContent("Q3");
    expect(container.querySelector('[data-component="Image"]')).not.toHaveAttribute("data-editable");
    expect(container.querySelector("input")).toBeNull();
  });

  it("draws nothing while it has no address", () => {
    const { container } = render(<Read node={{ type: "doc", content: [{ type: "image" }] }} />);
    expect(container.querySelector("img")).toBeNull();
  });
});
