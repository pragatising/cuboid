import { getSchema } from "@tiptap/core";
import type { DocNode } from "../core";
import { extensionsFor } from "../write/extensions";
import { migrateBlocks } from "./blocks";
import type { LegacyBlock } from "./legacy";

const schema = getSchema(extensionsFor());
/** The editor's strict check: loading JSON into the editor does not validate it, so this is what says a migration is a document the editor can hold. */
const assertValid = (doc: DocNode) => expect(() => schema.nodeFromJSON(doc).check()).not.toThrow();

const block = (tag: string, children = "", extra: Partial<LegacyBlock> = {}): LegacyBlock => ({ id: `b-${tag}`, tag, props: {}, children, ...extra });
const run = (...blocks: LegacyBlock[]) => {
  const result = migrateBlocks(blocks);
  assertValid(result.doc);
  return { ...result, nodes: result.doc.content! };
};
const kinds = (issues: { kind: string }[]) => issues.map((i) => i.kind);

describe("text blocks", () => {
  it("migrates paragraphs and headings, with inline marks", () => {
    const { nodes, issues } = run(block("p", "a **b**"), block("h", "Title", { variant: "2" }));
    expect(nodes[0]).toEqual({ type: "paragraph", content: [{ type: "text", text: "a " }, { type: "text", text: "b", marks: [{ type: "bold" }] }] });
    expect(nodes[1]).toEqual({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] });
    expect(issues).toEqual([]);
  });

  it("keeps empty blocks empty, and clamps a heading level to 1–3", () => {
    const { nodes } = run(block("p"), block("h", "", { variant: "9" }), block("h", "x"));
    expect(nodes[0]).toEqual({ type: "paragraph" });
    expect(nodes[1]).toEqual({ type: "heading", attrs: { level: 3 } });
    expect(nodes[2].attrs).toEqual({ level: 1 });
  });

  it("turns a block's colour, weight, italic and underline props into marks over its text", () => {
    const { nodes } = run(block("p", "x", { props: { color: "fg.teal.2", weight: "bold", italic: "true", underline: "true" } }));
    expect(nodes[0].content![0].marks).toEqual(expect.arrayContaining([{ type: "textColor", attrs: { color: "informational.strong" } }, { type: "bold" }, { type: "italic" }, { type: "underline" }]));
  });

  it("says what it could not keep: alignment, monospace, a colour the palette lacks", () => {
    const { issues } = run(block("p", "x", { props: { align: "center", monospace: "true", color: "fg.brown.1" } }));
    expect(kinds(issues)).toEqual(["dropped", "dropped", "dropped"]);
    expect(issues.map((i) => i.blockId)).toEqual(["b-p", "b-p", "b-p"]);
  });
});

describe("code and divider", () => {
  it("keeps code text and newlines, and the language", () => {
    const { nodes } = run(block("code", "const a = 1\nconst b = 2", { props: { language: "typescript" } }), block("code", "x"), block("code", "{}", { props: { language: "json" } }), block("code"));
    expect(nodes[0]).toEqual({ type: "codeBlock", attrs: { language: "typescript" }, content: [{ type: "text", text: "const a = 1\nconst b = 2" }] });
    expect(nodes[1].attrs).toEqual({ language: "text" });
    expect(nodes[2].attrs).toEqual({ language: "javascript" });
    expect(nodes[3]).toEqual({ type: "codeBlock", attrs: { language: "text" } });
  });

  it("migrates a divider", () => {
    expect(run(block("divider")).nodes).toEqual([{ type: "divider" }]);
  });
});

describe("lists", () => {
  const tree = (...items: object[]) => JSON.stringify({ items });
  const node = (title: string, children: object[] = []) => ({ id: title, title, kind: "item", children });

  it("migrates a bulleted list with nesting", () => {
    const { nodes } = run(block("list", tree(node("a", [node("a1")]), node("b")), { variant: "bullet" }));
    expect(nodes[0].type).toBe("bulletList");
    const first = nodes[0].content![0];
    expect(first.content![0]).toEqual({ type: "paragraph", content: [{ type: "text", text: "a" }] });
    expect(first.content![1].type).toBe("bulletList");
    expect(first.content![1].content![0].content![0].content![0].text).toBe("a1");
  });

  it("migrates a numbered list, and keeps marks in an item's title", () => {
    const { nodes } = run(block("list", tree(node("**one**")), { variant: "numbered" }));
    expect(nodes[0].type).toBe("orderedList");
    expect(nodes[0].content![0].content![0].content![0].marks).toEqual([{ type: "bold" }]);
  });

  it("reads the older flat shape, a string for each item", () => {
    const { nodes } = run(block("list", JSON.stringify({ items: ["x", "y"] }), { variant: "bullet" }));
    expect(nodes[0].content!.map((li) => li.content![0].content![0].text)).toEqual(["x", "y"]);
  });

  it("never leaves a list with no items", () => {
    expect(run(block("list", "not json", { variant: "bullet" })).nodes[0].content).toHaveLength(1);
  });
});

describe("callouts", () => {
  const holding = (...blocks: LegacyBlock[]) => JSON.stringify({ blocks });

  it("migrates a callout that holds blocks", () => {
    const { nodes } = run(block("callout", holding(block("h", "Heads up", { variant: "3" }), block("p", "Body")), { props: { background: "canvas.inset" } }));
    expect(nodes[0]).toMatchObject({ type: "callout", attrs: { color: "neutral", bordered: false } });
    expect(nodes[0].content!.map((n) => n.type)).toEqual(["heading", "paragraph"]);
  });

  it("migrates the older shape, a callout that is just its text", () => {
    const { nodes } = run(block("callout", "Plain **text**"));
    expect(nodes[0].content).toEqual([{ type: "paragraph", content: [{ type: "text", text: "Plain " }, { type: "text", text: "text", marks: [{ type: "bold" }] }] }]);
  });

  it.each([
    ["highlight.blue", "blue"],
    ["highlight.green", "green"],
    ["highlight.yellow", "yellowSoft"],
    ["highlight.yellow.sharp", "yellow"],
    ["highlight.red", "red"],
    ["highlight.teal", "teal"],
    ["highlight.magenta", "magenta"],
    ["highlight.gray", "gray"],
    ["highlight.lime", "lime"],
    ["canvas.inset", "neutral"],
    ["bg.gray.light.2", "neutral"],
    ["bg.gray.light.3", "neutral"],
    ["bg.gray.light.4", "gray"],
    [undefined, "neutral"],
  ])("maps the background %s to the %s colour", (background, color) => {
    expect(run(block("callout", "x", { props: background ? { background } : {} })).nodes[0].attrs).toEqual({ color, bordered: false });
  });

  it("is never empty", () => {
    expect(run(block("callout", "")).nodes[0].content).toEqual([{ type: "paragraph" }]);
  });

  it("flattens a callout inside a callout, keeping its content, and says so", () => {
    const { nodes, issues } = run(block("callout", holding(block("callout", "inner"))));
    expect(nodes[0].content!.map((n) => n.type)).toEqual(["paragraph"]);
    expect(kinds(issues)).toContain("approximated");
  });

  it("keeps a callout's border", () => {
    const { nodes, issues } = run(block("callout", "x", { props: { border: "true" } }));
    expect(nodes[0].attrs).toMatchObject({ bordered: true });
    expect(issues).toEqual([]);
  });
});

describe("columns", () => {
  const cols = (...widths: number[]) => JSON.stringify({ columns: widths.map((width, i) => ({ width, blocks: [block("p", `col ${i + 1}`)] })) });

  it("keeps each column's share and its blocks", () => {
    const { nodes } = run(block("box", cols(2, 1), { variant: "2" }));
    expect(nodes[0].type).toBe("columns");
    expect(nodes[0].content!.map((c) => c.attrs)).toEqual([{ flex: 2 }, { flex: 1 }]);
    expect(nodes[0].content![0].content![0].content![0].text).toBe("col 1");
  });

  it("pads one column to two, and keeps four of five, saying so", () => {
    expect(run(block("box", cols(1))).nodes[0].content).toHaveLength(2);
    const five = run(block("box", cols(1, 1, 1, 1, 1)));
    expect(five.nodes[0].content).toHaveLength(4);
    expect(kinds(five.issues)).toEqual(["dropped"]);
  });

  it("gives an empty column a paragraph, and a bad width a share of 1", () => {
    const empty = JSON.stringify({ columns: [{ width: 0, blocks: [] }, { width: "x", blocks: [] }] });
    const { nodes } = run(block("box", empty));
    expect(nodes[0].content!.map((c) => c.attrs)).toEqual([{ flex: 1 }, { flex: 1 }]);
    expect(nodes[0].content![0].content).toEqual([{ type: "paragraph" }]);
  });

  it("makes columns from the variant when the content is unreadable", () => {
    expect(run(block("box", "garbage", { variant: "3" })).nodes[0].content).toHaveLength(3);
  });

  it("flattens columns inside a column, since a column cannot hold columns", () => {
    const inner = block("box", cols(1, 1));
    const { nodes, issues } = run(block("box", JSON.stringify({ columns: [{ width: 1, blocks: [inner] }, { width: 1, blocks: [] }] })));
    expect(nodes[0].content![0].content!.map((n) => n.type)).toEqual(["paragraph", "paragraph"]);
    expect(kinds(issues)).toContain("approximated");
  });

  it("puts a block that is not converted yet in a column, whole", () => {
    const table = block("links", "", { props: { src: "x.png" } });
    const { nodes } = run(block("box", JSON.stringify({ columns: [{ width: 1, blocks: [block("p", "text")] }, { width: 1, blocks: [table] }] })));
    expect(nodes[0].content![1].content![0]).toMatchObject({ type: "legacy", attrs: { tag: "links", props: { src: "x.png" } } });
  });
});

describe("images", () => {
  const convertOne = (props: Record<string, string>) => migrateBlocks([block("img", "", { props })]).doc.content![0];

  it("becomes an image block with its address, alt text and caption", () => {
    expect(convertOne({ src: "asset:abc", alt: "The team", caption: "All of us" })).toEqual({ type: "image", attrs: { src: "asset:abc", alt: "The team", caption: "All of us", width: 100, bordered: true } });
  });

  it("reads the old width, a percentage, and keeps it between the narrowest and the column", () => {
    expect(convertOne({ src: "a", width: "60%" }).attrs).toMatchObject({ width: 60 });
    expect(convertOne({ src: "a", width: "5%" }).attrs).toMatchObject({ width: 20 });
    expect(convertOne({ src: "a", width: "300%" }).attrs).toMatchObject({ width: 100 });
    expect(convertOne({ src: "a" }).attrs).toMatchObject({ width: 100 });
  });

  it("keeps the old border setting: on unless it said false", () => {
    expect(convertOne({ src: "a", border: "false" }).attrs).toMatchObject({ bordered: false });
    expect(convertOne({ src: "a" }).attrs).toMatchObject({ bordered: true });
  });

  it("is not reported as unsupported", () => {
    expect(migrateBlocks([block("img", "", { props: { src: "a" } })]).issues).toEqual([]);
  });
});

describe("blocks with no counterpart yet", () => {
  it.each(["links", "buttons", "somethingNew"])("keeps a %s block whole, visibly, and says so", (tag) => {
    const original = block(tag, '{"rows":[["a"]]}', { variant: "v", props: { src: "https://x.test/a.png" } });
    const { nodes, issues } = run(original);
    expect(nodes[0]).toEqual({ type: "legacy", attrs: { tag, variant: "v", props: { src: "https://x.test/a.png" }, children: '{"rows":[["a"]]}' } });
    expect(issues).toEqual([expect.objectContaining({ kind: "unsupported", tag, blockId: `b-${tag}` })]);
  });

  it("loses nothing: every legacy block carries its original, so a later step can convert it", () => {
    const originals = [block("links", "", { props: { src: "a" } }), block("buttons", ""), block("buttons", '{"items":[]}')];
    const legacy = run(...originals).nodes.map((n) => n.attrs);
    expect(legacy.map((a) => [a!.tag, a!.children])).toEqual(originals.map((o) => [o.tag, o.children]));
  });
});

describe("a page", () => {
  it("is never empty", () => {
    expect(migrateBlocks([]).doc).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });

  it("migrates a realistic page into a valid document, with only the not-yet-converted blocks reported", () => {
    const page: LegacyBlock[] = [
      block("h", "Policy Optimization", { variant: "1" }),
      block("p", "{date:2026-08-01}Aug 1, 2026{/date}"),
      block("callout", "This project is **the first project where I built the entire front-end**. 1 back-end engineer.", { props: { background: "highlight.blue" } }),
      block("h", "Background", { variant: "2" }),
      block("p", "Lenders route applications. {bg:highlight.red}Many mid-sized clients keep manual review volume high.{/bg}", { props: { color: "text.muted" } }),
      block("callout", JSON.stringify({ blocks: [block("p", "**Persona**"), block("p", "Imagine **Donna**."), block("list", JSON.stringify({ items: [{ id: "1", title: "Policy is set once", kind: "item", children: [] }] }), { variant: "bullet" })] })),
      block("box", JSON.stringify({ columns: [{ width: 1, blocks: [block("h", "Begin with portfolio health", { variant: "3" }), block("p", "Help users first understand.")] }, { width: 2, blocks: [block("links", "", { props: { src: "r2://a.png" } })] }] }), { variant: "2" }),
      block("divider"),
    ];
    const { doc, issues } = migrateBlocks(page);
    assertValid(doc);
    expect(doc.content!.map((n) => n.type)).toEqual(["heading", "paragraph", "callout", "heading", "paragraph", "callout", "columns", "divider"]);
    expect(issues.map((i) => [i.kind, i.tag])).toEqual([["unsupported", "links"]]);
  });
});

describe("embeds", () => {
  const convertOne = (props: Record<string, string>) => migrateBlocks([block("embed", "", { props })]);

  it("becomes a link block, an embed with the address and the height", () => {
    const { doc, issues } = convertOne({ src: "https://www.figma.com/design/abc", height: "16:9" });
    expect(doc.content![0]).toEqual({ type: "smartLink", attrs: { url: "https://www.figma.com/design/abc", appearance: "embed", height: "16:9" } });
    expect(issues).toEqual([]);
  });

  it("is inline when its style was the chip, and has no height unless it named one that exists", () => {
    expect(convertOne({ src: "https://a.com", style: "inline" }).doc.content![0].attrs).toEqual({ url: "https://a.com", appearance: "inline", height: "" });
    expect(convertOne({ src: "https://a.com", height: "huge" }).doc.content![0].attrs).toMatchObject({ height: "" });
  });

  it("says what the chip's own title, icon, pill and colours could not keep", () => {
    const { issues } = convertOne({ src: "https://a.com", style: "inline", title: "Brief", pill: "New", background: "blue" });
    expect(kinds(issues)).toEqual(["dropped"]);
    expect(issues[0].message).toMatch(/title, pill, background/);
  });
});

describe("outlines", () => {
  const outline = (items: unknown, tag = "outlineTree") => migrateBlocks([block(tag, JSON.stringify({ items }))]);

  it("becomes an outline with its nesting, whatever the depth, and its titles' marks", () => {
    const { doc, issues } = outline([
      { id: "x", title: "One **bold**", kind: "item", children: [{ title: "a", children: [{ title: "a.1", children: [{ title: "a.1.1", children: [{ title: "deeper", children: [] }] }] }] }] },
      { title: "Two", children: [] },
    ]);
    expect(issues).toEqual([]);
    const tree = doc.content![0];
    expect(tree.type).toBe("outlineTree");
    expect(tree.content).toHaveLength(2);
    const [one] = tree.content!;
    expect(one.content![0].content![0].text).toBe("One ");
    expect(one.content![0].content![1]).toMatchObject({ text: "bold", marks: [{ type: "bold" }] });
    const deepest = one.content![1].content![0].content![1].content![0].content![1].content![0].content![1].content![0];
    expect(deepest.content![0].content![0].text).toBe("deeper");
    expect(tree.content![1].content).toHaveLength(1);
  });

  it("reads the older name, and keeps one empty item when the old tree had none", () => {
    expect(outline([{ title: "A", children: [] }], "numberedTree").doc.content![0].type).toBe("outlineTree");
    expect(outline([]).doc.content![0]).toEqual({ type: "outlineTree", content: [{ type: "outlineItem", content: [{ type: "paragraph" }] }] });
  });
});

describe("a table", () => {
  const cells = (table: DocNode) => table.content!.map((r) => r.content!.map((c) => c.content?.map((n) => n.text).join("") ?? ""));

  it("becomes rows of cells with the inline content of each, and no header row", () => {
    const { nodes, issues } = run(block("table", JSON.stringify({ rows: [["a", "**bold** and {date:2026-01-02}{/date}"], ["c", "d"]] })));
    expect(nodes[0].type).toBe("table");
    expect(cells(nodes[0])).toEqual([["a", "bold and "], ["c", "d"]]);
    const second = nodes[0].content![0].content![1].content!;
    expect(second[0].marks).toEqual([{ type: "bold" }]);
    expect(second[2].type).toBe("date");
    assertValid({ type: "doc", content: nodes });
    expect(nodes[0].content!.flatMap((r) => r.content!).every((c) => c.type === "tableCell")).toBe(true);
    expect(issues).toEqual([]);
  });

  it("fills a short row out to the table's width", () => {
    const { nodes } = run(block("table", JSON.stringify({ rows: [["a", "b", "c"], ["d"]] })));
    expect(cells(nodes[0])).toEqual([["a", "b", "c"], ["d", "", ""]]);
  });

  it("is never empty: no rows is one empty cell", () => {
    const { nodes } = run(block("table", '{"rows":[]}'));
    expect(cells(nodes[0])).toEqual([[""]]);
    expect(run(block("table", "not json")).nodes[0].type).toBe("table");
  });

  it("says what it cannot keep: columns past the cap, and widths", () => {
    const wide = Array.from({ length: 14 }, (_, i) => String(i));
    const { nodes, issues } = run(block("table", JSON.stringify({ rows: [wide], colWidths: [0.5, 1.5] })));
    expect(nodes[0].content![0].content).toHaveLength(12);
    expect(issues.map((i) => [i.kind, i.tag])).toEqual([["dropped", "table"], ["dropped", "table"]]);
  });

  it("keeps equal widths silent", () => {
    expect(run(block("table", JSON.stringify({ rows: [["a", "b"]], colWidths: [1, 1] }))).issues).toEqual([]);
  });
});
