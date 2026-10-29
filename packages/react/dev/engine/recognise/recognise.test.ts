// @vitest-environment node
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import components from "../../generated/components.json";
import { cover } from "../cover";
import { allowedBy, domainsOf } from "../domains";
import { buildNode } from "../print";
import { COMPILER_OPTIONS, extractLibrary } from "../extract/extractLibrary";
import { createExtractor } from "../extract/extractModel";
import { propDoc, recognise } from "./recognise";
import { roleOf, supportsAria } from "./role";

const root = path.resolve(__dirname, "../../..");
const library = extractLibrary(path.join(root, "src/index.ts"), root);
const models = Object.fromEntries(Object.entries(library.all).map(([id, e]) => [id, e.model]));
const exported = Object.fromEntries(Object.entries(library.components).map(([name, e]) => [name, e.model.declared]));
const of = (name: string) => recognise(library.components[name].model, models, exported);
const fixtures = { labels: { short: "Save changes", long: "Save all changes and continue" }, fillers: { "*": { tag: "Icon", props: { name: "add" } } } };

describe("what kind of value a prop takes, from its type", () => {
  const kind = (type: string, name = "x") => propDoc({ name, type, required: false });

  it("reads literal unions, booleans, nodes, functions and plain values", () => {
    expect(kind('"a" | "b"')).toMatchObject({ kind: "enum", values: ["a", "b"] });
    expect(kind("1 | 2")).toMatchObject({ kind: "enum", values: [1, 2] });
    expect(kind("boolean").kind).toBe("flag");
    expect(kind("ReactNode").kind).toBe("slot");
    expect(kind("(on: boolean) => void", "onChange").kind).toBe("event");
    expect(kind("(on: boolean) => void", "render").kind).toBe("function");
    expect(kind("string").kind).toBe("value");
    expect(kind("string | number").kind).toBe("value");
    expect(kind("RefObject<HTMLElement>").kind).toBe("ref");
  });

  it("does not split a union inside a generic", () => {
    expect(kind("Array<'a' | 'b'>").kind).toBe("other");
  });

  it("calls an event by its name when the type is an alias it cannot read", () => {
    expect(kind("OnChangeFn<SortingState>", "onSortingChange").kind).toBe("event");
  });

  it("keeps the default", () => {
    expect(propDoc({ name: "size", type: '"sm" | "md"', required: false, default: '"md"' }).default).toBe('"md"');
  });
});

describe("what a component's model says about its inputs", () => {
  it("finds the props that mean cannot be used right now by following where they go", () => {
    // Button hands its props to ButtonBase, which sets `aria-disabled` from `loading` and `inactive`; `disabled` is the platform's own.
    expect([...of("Button").conditions].sort()).toEqual(["disabled", "inactive", "loading"]);
    expect([...of("Switch").conditions].sort()).toEqual(["disabled", "readOnly"]);
    expect([...of("Select").conditions].sort()).toEqual(["disabled", "error", "loading", "readOnly"]);
    expect(of("Text").conditions).toEqual([]);
  });

  it("finds the scenarios a component can be in, one at a time, from ARIA's states and what feeds them", () => {
    // `error` reaches `aria-invalid` through a hook (`useFieldControl`) that is followed to the argument each output comes from, so
    // `id`, `description` and `showCount`, which feed the same hook, are not scenarios.
    expect([...of("InputText").conditions].sort()).toEqual(["disabled", "error", "readOnly"]);
    expect([...of("Autocomplete").conditions].sort()).toEqual(["error", "loading"]);
    // `empty` is shown only when a test made from `loading` and the items holds; `description` is guarded by itself.
    expect(of("Autocomplete").scenarios).toEqual(["empty"]);
    expect(of("InputText").scenarios).toEqual([]);
    // `heading` and `description` share a wrapper's guard, which is not a scenario.
    expect(of("EmptyState").scenarios).toEqual([]);
  });

  it("finds the state the app can hold: a prop, its default and its change handler", () => {
    expect(of("ActionMenu").state).toEqual(["open", "defaultOpen", "onOpenChange"]);
    expect(of("Switch").state).toEqual(expect.arrayContaining(["checked", "defaultChecked", "onCheckedChange"]));
    expect(of("Button").state).toEqual([]);
    expect(domainsOf(of("ActionMenu").doc, fixtures).skipped.map((s) => s.prop)).toEqual(expect.arrayContaining(["open", "defaultOpen", "onOpenChange"]));
  });

  it("finds which components take content, by where `children` goes, though their types do not declare it", () => {
    const takes = (name: string) => of(name).doc.props.some((p) => p.name === "children");
    // Link names `children` in its parameter; Box places `{children}` after destructuring it in the body; Callout hands its props to Box.
    for (const name of ["Link", "Box", "Heading", "Text", "Container", "Callout"]) expect(takes(name), name).toBe(true);
    // Divider is an `<hr>`, Icon writes its own child, InputText spreads onto an `<input>`, Switch is labelled by `label`, Breadcrumbs takes `items`.
    for (const name of ["Divider", "Icon", "InputText", "Switch", "IconButton", "Breadcrumbs"]) expect(takes(name), name).toBe(false);
    expect(of("Callout").contentFromNative).toBe(true);
  });

  it("lists a prop a library type brings when the parameter names it", () => {
    const disabled = library.components.Switch.model.props.find((p) => p.name === "disabled");
    expect(disabled).toMatchObject({ inherited: true, type: "boolean" });
    expect(of("Switch").doc.props.find((p) => p.name === "disabled")?.kind).toBe("flag");
  });

  it("agrees with components.json on the kind of every prop, except where the model reads more", () => {
    const json = components as unknown as Record<string, { props: { name: string; kind: string }[] }>;
    const disagreements: string[] = [];
    for (const name of Object.keys(library.components)) {
      if (!json[name]) continue;
      const mine = new Map(of(name).doc.props.map((p) => [p.name, p.kind]));
      for (const p of json[name].props) {
        const kind = mine.get(p.name);
        if (!kind || kind === p.kind) continue;
        const moreKnown = kind === "state" || kind === "ref" || kind === "event" || (p.kind === "value" && kind === "other");
        if (!moreKnown) disagreements.push(`${name}.${p.name}: json ${p.kind} / model ${kind}`);
      }
    }
    expect(disagreements).toEqual([]);
  });
});

describe("compound parts and slots that want an element", () => {
  it("finds the parts a component carries, and which are items and which hold them, from their ARIA roles", () => {
    const parts = (name: string) => Object.fromEntries((of(name).doc.parts ?? []).map((p) => [p.name, p]));
    expect(parts("ActionMenu").Item).toMatchObject({ item: true, container: false });
    expect(parts("ActionMenu").List).toMatchObject({ item: false, container: true });
    expect(parts("Select").Option.item).toBe(true);
    expect(parts("Header").Leading).toMatchObject({ item: false, content: true });
  });

  it("places a part by what HTML needs around it: an li in the part that renders the ul, a row in the header, a cell in the row", () => {
    const inside = (name: string) => Object.fromEntries((of(name).doc.parts ?? []).map((p) => [p.name, p.inside]));
    expect(inside("Sidebar").Item).toBe("Sidebar.Section");
    expect(inside("Sidebar").Section).toBeUndefined();
    expect(inside("Table")).toMatchObject({ Header: undefined, Body: undefined, Row: "Table.Header", Cell: "Table.Row", HeadCell: "Table.Row" });
    expect((of("Table").doc.parts ?? []).find((p) => p.name === "Row")?.alsoInside).toEqual(["Table.Body"]);
    // The container a menu's items go in comes from HTML now (an `li` in a `ul`) where the code lets it be read.
    expect(inside("ActionMenu").Item).toBe("ActionMenu.List");
  });

  it("leaves out a part nothing the component renders can hold: a div wrapper cannot go in a table", () => {
    const parts = Object.fromEntries((of("Table").doc.parts ?? []).map((p) => [p.name, p]));
    expect(parts.Root.placeable).toBe(false);
    expect(parts.Header.once).toBe(true);
    expect(parts.Row.once).toBeUndefined();
    // It is not a child of the table: it is the shell around it, since what it holds (flow content) can hold a `table`.
    expect(parts.Root.wraps).toBe(true);
    expect(parts.Header.wraps).toBeUndefined();
    // Select puts its options in a native `<select>` or in a popup list, and either may hold them.
    expect((of("Select").doc.parts ?? []).every((p) => p.placeable)).toBe(true);
  });

  it("finds a slot the component clones props onto, and fills it with a button the library has", () => {
    const trigger = of("ActionMenu").doc.props.find((p) => p.name === "trigger");
    expect(trigger).toMatchObject({ element: true, filler: { tag: "Button" } });
    expect(of("Button").doc.props.some((p) => p.element)).toBe(false);
  });

  it("writes children from the parts: items in the part that owns them, or each content part once", () => {
    const children = (name: string) => {
      const { doc } = of(name);
      const { domains } = domainsOf(doc, fixtures);
      const row = cover(domains, { strength: 1 }).rows[0];
      return buildNode(doc, row.picks).children;
    };
    const tags = (nodes: unknown) => (nodes as { tag: string; children?: unknown[] }[]).map((n) => `${n.tag}${n.children && typeof n.children[0] === "object" ? `[${(n.children as { tag: string }[]).map((c) => c.tag).join(",")}]` : ""}`);
    expect(tags(children("ActionMenu"))).toEqual(["ActionMenu.List[ActionMenu.Item,ActionMenu.Item,ActionMenu.Item]"]);
    expect(tags(children("Header"))).toEqual(expect.arrayContaining(["Header.Leading", "Header.Trailing"]));
    expect(tags(children("Select"))).toEqual(["Select.Option", "Select.Option", "Select.Option"]);
  });

  it("writes a part that goes around the component around it: a table inside the shell that carries its styling", () => {
    const { doc } = of("Table");
    const { domains } = domainsOf(doc, fixtures);
    const node = buildNode(doc, cover(domains, { strength: 1 }).rows[0].picks);
    expect(node.tag).toBe("Table.Root");
    expect((node.children as { tag: string }[]).map((c) => c.tag)).toEqual(["Table"]);
  });

  it("nests them as HTML needs: a table is a header with rows of cells, and no div wrapper or text between its tags", () => {
    const { doc } = of("Table");
    const { domains } = domainsOf(doc, fixtures);
    // The table is inside its shell (`Table.Root`): its own children are the header and the body.
    const shell = buildNode(doc, cover(domains, { strength: 1 }).rows[0].picks);
    const children = (shell.children as { children: unknown }[])[0].children as { tag: string; children: { tag: string; children: { tag: string }[] }[] }[];
    expect(children.map((c) => c.tag)).toEqual(["Table.Header", "Table.Body"]);
    // Column labels in one row of the header; data in the rows of the body.
    expect(children[0].children.map((c) => c.tag)).toEqual(["Table.Row"]);
    expect(children[0].children[0].children.map((c) => c.tag)).toEqual(["Table.HeadCell", "Table.HeadCell", "Table.HeadCell"]);
    expect(children[1].children.map((c) => c.tag)).toEqual(["Table.Row", "Table.Row", "Table.Row"]);
    expect(children[1].children[0].children.map((c) => c.tag)).toEqual(["Table.Cell", "Table.Cell", "Table.Cell"]);
  });

  it("gives a required prop of a part a sample, so an instance can be written", () => {
    const { doc } = of("Select");
    const { domains } = domainsOf(doc, fixtures);
    const option = (buildNode(doc, cover(domains, { strength: 1 }).rows[0].picks).children?.[0] ?? {}) as { props?: Record<string, unknown> };
    expect(option.props).toEqual({ value: "value-1" });
  });
});

describe("where a component's content comes from", () => {
  const fixture = path.join(__dirname, "../extract/fixtures/Placeholder.tsx");
  const program = ts.createProgram([fixture], COMPILER_OPTIONS);
  const read = (name: string) => {
    const { model } = createExtractor(program, root).extract(program.getSourceFile(fixture)!, name)!;
    return recognise(model, { [model.declared]: model }, {}).contentFromOptional;
  };

  it("finds a component whose content is only optional named props: with none set it has nothing to draw", () => {
    // An `icon` typed as a free string is a value to be supplied, not content the engine can draw; the slots are.
    expect(read("Placeholder")).toEqual(["heading", "description"]);
  });

  it("leaves out a component that needs one of them to exist", () => {
    expect(read("Notice")).toEqual([]);
  });

  it("leaves out a component with children, or one that needs a slot to exist", () => {
    expect(of("Button").contentFromOptional).toEqual([]);
    expect(of("Box").contentFromOptional).toEqual([]);
    expect(of("Tooltip").contentFromOptional).toEqual([]);
  });

  it("is what EmptyState no longer is: it requires an icon and a description", () => {
    expect(of("EmptyState").contentFromOptional).toEqual([]);
  });
});

describe("a set of choices", () => {
  const parts = (name: string) => Object.fromEntries((of(name).doc.parts ?? []).map((p) => [p.name, p]));

  it("is a part with a required `value`: it is one of several, so an example has more than one, with different labels", () => {
    expect(parts("SegmentedControl").Item.item).toBe(true);
    const { doc } = of("SegmentedControl");
    const { domains } = domainsOf(doc, fixtures);
    for (const row of cover(domains, { strength: 2 }).rows) {
      const items = (buildNode(doc, row.picks).children ?? []) as { props?: { value?: string }; children?: string[] }[];
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(new Set(items.map((i) => i.children?.[0])).size).toBe(items.length);
      expect(new Set(items.map((i) => i.props?.value)).size).toBe(items.length);
    }
  });

  it("starts with the first chosen, through `defaultValue`", () => {
    const { doc } = of("SegmentedControl");
    const { domains } = domainsOf(doc, fixtures);
    expect(buildNode(doc, cover(domains, { strength: 1 }).rows[0].picks).props).toMatchObject({ defaultValue: "value-1" });
  });
});

describe("what a role supports", () => {
  it("rules out an ARIA attribute the role does not take, and keeps one it does", () => {
    const textbox = roleOf(library.components.InputText.model, models);
    const button = roleOf(library.components.Button.model, models);
    expect(supportsAria(textbox, "aria-invalid")).toBe(true);
    expect(supportsAria(button, "aria-invalid")).toBe(false);
    expect(supportsAria(button, "aria-disabled")).toBe(true);
    expect(supportsAria(null, "aria-invalid")).toBe(true);
  });
});

describe("from the model to examples", () => {
  it("gives Button the same five and sixteen it had, now with nothing written by hand about it", () => {
    const { doc, conditions } = of("Button");
    const { domains } = domainsOf(doc, fixtures);
    const valid = allowedBy([conditions]);
    expect(cover(domains, { strength: 1, valid }).rows).toHaveLength(5);
    expect(cover(domains, { strength: 2, valid }).rows).toHaveLength(16);
  });

  it("never turns on two conditions in one example", () => {
    const { doc, conditions } = of("Button");
    const { domains } = domainsOf(doc, fixtures);
    for (const row of cover(domains, { strength: 2, valid: allowedBy([conditions]) }).rows)
      expect(conditions.filter((c) => row.picks[c] && !row.picks[c].baseline).length).toBeLessThanOrEqual(1);
  });
});
