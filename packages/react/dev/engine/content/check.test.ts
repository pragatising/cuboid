// @vitest-environment node
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractLibrary } from "../extract/extractLibrary";
import type { Node } from "../types";
import { allowedBy, domainsOf } from "../domains";
import { cover } from "../cover";
import { buildNode } from "../print";
import { recognise } from "../recognise/recognise";
import { slotChains } from "../recognise/role";
import { checkComposition } from "./check";
import { HTML } from "./html";

const root = path.resolve(__dirname, "../../..");
const library = extractLibrary(path.join(root, "src/index.ts"), root);
const env = {
  models: Object.fromEntries(Object.entries(library.all).map(([id, e]) => [id, e.model])),
  exported: Object.fromEntries(Object.entries(library.components).map(([name, e]) => [name, e.model.declared])),
};
const check = (node: Node) => checkComposition(node, env);
const rules = (node: Node) => check(node).map((i) => i.rule);

const fixtures = { labels: { short: "Save changes", long: "Save all changes and continue" }, fillers: { "*": { tag: "Icon", props: { name: "add" } } } };
const icon: Node = { tag: "Icon", props: { name: "add" } };
const table: Node = { tag: "Table", children: [] };
const button: Node = { tag: "Button", children: ["Go"] };

describe("the HTML tier", () => {
  it("knows the elements the library writes", () => {
    const written = ["span", "div", "button", "input", "label", "em", "pre", "table", "colgroup", "col", "hr", "mark", "a", "nav", "ol", "li", "textarea", "thead", "tbody", "tr", "th", "td", "select", "option", "optgroup", "main", "dl", "svg"];
    expect(written.filter((tag) => !HTML[tag])).toEqual([]);
  });

  it("says each element's categories and what it admits", () => {
    expect(HTML.button.categories).toEqual(expect.arrayContaining(["phrasing", "interactive"]));
    expect(HTML.button.content).toEqual({ admits: "categories", categories: ["phrasing"] });
    expect(HTML.button.forbids).toEqual(["interactive"]);
    expect(HTML.table.categories).not.toContain("phrasing");
  });
});

describe("what fits where: a button's leading visual", () => {
  it("takes an icon", () => {
    expect(check({ tag: "Button", props: { leadingVisual: icon }, children: ["Go"] })).toEqual([]);
  });

  it("takes text", () => {
    expect(check({ tag: "Button", props: { leadingVisual: "New" }, children: ["Go"] })).toEqual([]);
  });

  it("does not take a table: it lands in a span, which admits phrasing content only", () => {
    const [issue] = check({ tag: "Button", props: { leadingVisual: table }, children: ["Go"] });
    expect(issue).toMatchObject({ rule: "html.content-model", severity: "error", path: ["Button", "leadingVisual", "Table"] });
    expect(issue.message).toContain("<table> (flow)");
    expect(issue.message).toContain("<span>");
    expect(issue.message).toContain("phrasing content");
  });

  it("does not take another button: a button forbids interactive content among its descendants", () => {
    const found = check({ tag: "Button", props: { leadingVisual: button }, children: ["Go"] });
    expect(found.map((i) => i.rule)).toEqual(["html.nested-interactive"]);
    expect(found[0].references).toEqual(expect.arrayContaining([expect.objectContaining({ criterion: "4.1.2" })]));
  });

  it("does not take a link or a field either, however deep", () => {
    const wrapped: Node = { tag: "span", children: [{ tag: "a", children: ["x"] }] };
    expect(rules({ tag: "Button", props: { leadingVisual: wrapped }, children: ["Go"] })).toEqual(["html.nested-interactive"]);
  });

  it("applies to the trailing visual and to the label the same way", () => {
    expect(rules({ tag: "Button", props: { trailingVisual: button }, children: ["Go"] })).toEqual(["html.nested-interactive"]);
    expect(rules({ tag: "Button", children: [table] })).toEqual(["html.content-model"]);
  });
});

describe("what HTML alone leaves open", () => {
  it("allows a table in a Header's leading region: the element admits flow content", () => {
    // Which is why a system layer is needed: nothing in HTML says a header region is no place for a table.
    expect(check({ tag: "Header", children: [{ tag: "Header.Leading", children: [table] }] })).toEqual([]);
  });

  it("allows a button in a Header's trailing region", () => {
    expect(check({ tag: "Header", children: [{ tag: "Header.Trailing", children: [button] }] })).toEqual([]);
  });
});

describe("composition in general", () => {
  it("rejects a div in a paragraph and an item outside a list", () => {
    expect(rules({ tag: "p", children: [{ tag: "div", children: ["x"] }] })).toEqual(["html.content-model"]);
    expect(rules({ tag: "div", children: [{ tag: "li", children: ["x"] }] })).toEqual(["html.content-model"]);
  });

  it("looks through an anchor to what its parent admits", () => {
    expect(rules({ tag: "p", children: [{ tag: "a", children: [{ tag: "div", children: ["x"] }] }] })).toEqual(["html.content-model"]);
    expect(check({ tag: "div", children: [{ tag: "a", children: [{ tag: "div", children: ["x"] }] }] })).toEqual([]);
  });

  it("rejects text where only elements go, and a row outside a table", () => {
    expect(rules({ tag: "ul", children: ["loose text"] })).toEqual(["html.content-model"]);
    expect(rules({ tag: "div", children: [{ tag: "tr", children: [] }] })).toEqual(["html.content-model"]);
  });

  it("says nothing about content it cannot read", () => {
    expect(check({ tag: "Button", props: { leadingVisual: { tag: "NotAComponent" } }, children: ["Go"] })).toEqual([]);
    expect(check({ tag: "NotAComponent", children: [table] })).toEqual([]);
  });
});

describe("where a slot lands", () => {
  const chains = (name: string, slot: string) => slotChains(library.components[name].model, env.models, slot).filter((c) => c.length);

  it("follows a slot through the components it is handed to, to the element that holds it", () => {
    // Button hands everything to ButtonBase, which wraps the visual in a span inside the button.
    expect(chains("Button", "leadingVisual")).toEqual([["button", "span", "span"]]);
    expect(chains("Button", "children")).toEqual([["button", "span", "span"]]);
  });

  it("puts `children` passed through spread props in the element that gets them", () => {
    expect(chains("Box", "children")).toEqual([["div"]]);
    expect(chains("Callout", "children")).toEqual([["div"]]);
    expect(chains("Heading", "children")).toEqual([["h2"]]);
  });

  it("follows a dotted component, `InputField.Shell`", () => {
    expect(chains("InputText", "leadingVisual").length).toBeGreaterThan(0);
  });
});

describe("what the checker finds in what the examples engine writes", () => {
  it("finds that Sidebar.Item, an li, cannot go straight in Sidebar: HTML needs a list between", () => {
    const found = check({ tag: "Sidebar", children: [{ tag: "Sidebar.Item", children: ["One"] }] });
    expect(found.map((i) => i.rule)).toEqual(["html.content-model"]);
    expect(found[0].message).toContain("<li>");
  });

  it("finds that a Table cannot take text directly", () => {
    expect(rules({ tag: "Table", children: ["text"] })).toEqual(["html.content-model"]);
  });
});

describe("examples the engine composes", () => {
  // A generated example is a composition like any other: the content model holds it to the same rules. Every finding here is the
  // generator writing something HTML does not allow.
  const generated = (name: string) => {
    const { doc, conditions, scenarios } = recognise(library.components[name].model, env.models, env.exported);
    const { domains, blocked } = domainsOf(doc, fixtures);
    if (!domains.length || blocked.length) return [];
    const { rows } = cover(domains, { strength: 1, valid: allowedBy([[...conditions, ...scenarios]]) });
    return rows.flatMap((row) => check(buildNode(doc, row.picks)).map((issue) => `${name}: ${issue.message}`));
  };

  it("are valid HTML for every component of the library", () => {
    expect(Object.keys(library.components).flatMap(generated)).toEqual([]);
  });

  it("are actually generated: a compound component's parts are nested, not dropped", () => {
    const { doc } = recognise(library.components.Sidebar.model, env.models, env.exported);
    expect(doc.parts?.some((p) => p.tag === "Sidebar.Item" && p.inside === "Sidebar.Section")).toBe(true);
  });
});
