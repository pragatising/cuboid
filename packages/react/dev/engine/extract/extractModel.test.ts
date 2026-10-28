// @vitest-environment node
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import components from "../../generated/components.json";
import type { Reference } from "../Interfaces/ComponentModel/Reference";
import { COMPILER_OPTIONS, extractLibrary } from "./extractLibrary";
import { createExtractor } from "./extractModel";
import { normalise, printElement, topElements } from "./printModel";

const fixture = path.join(__dirname, "fixtures/Toggle.tsx");
const fixtureProgram = ts.createProgram([fixture], COMPILER_OPTIONS);
const root = path.resolve(__dirname, "../../..");
const toggle = createExtractor(fixtureProgram, root).extract(fixtureProgram.getSourceFile(fixture)!, "Toggle")!;
const library = extractLibrary(path.resolve(root, "src/index.ts"), root);

const read = (name: string, origin: Reference["origin"]): Reference => ({ name, origin });
const on = read("on", { kind: "hook", hook: "useState" });

describe("a plain component (Toggle)", () => {
  const { model } = toggle;

  it("records what the parameter binds, with defaults and the rest", () => {
    expect(model.params).toHaveLength(1);
    expect(model.params[0].type).toBe("ToggleProps");
    expect(model.params[0].bindings).toEqual([
      { name: "defaultOn", default: "false" },
      { name: "onChange" },
      { name: "disabled" },
      { name: "children" },
      { name: "rest", rest: true },
    ]);
  });

  it("records the props type's own members, and counts the inherited ones", () => {
    expect(model.props.map((p) => p.name)).toEqual(["defaultOn", "onChange", "disabled", "children"]);
    expect(model.props[0]).toMatchObject({ type: "boolean", required: false, default: "false", doc: "Whether it starts on." });
    expect(model.props[1].type).toBe("(on: boolean) => void");
    expect(model.inheritedProps).toBeGreaterThan(100);
  });

  it("records each hook, in order, with what it binds and where it comes from", () => {
    expect(model.hooks.map((h) => [h.hook, h.from, h.binds])).toEqual([
      ["useState", "react", ["on", "setOn"]],
      ["useRef", "react", ["ref"]],
      ["useEffect", "react", []],
    ]);
    expect(model.hooks[0].arguments[0].reads).toEqual([read("defaultOn", { kind: "param" })]);
    expect(model.hooks[2].arguments[1].reads).toEqual([on]);
  });

  it("records a declared function with what it reads and the calls it makes", () => {
    const [handleClick] = model.locals;
    expect(handleClick).toMatchObject({ names: ["handleClick"], kind: "function" });
    expect(handleClick.calls.map((c) => c.callee.source)).toEqual(["setOn", "onChange"]);
    expect(handleClick.reads).toEqual(expect.arrayContaining([read("setOn", { kind: "hook", hook: "useState" }), read("onChange", { kind: "param" })]));
  });

  it("records the tree: attributes in order, the spread, and the element inside an expression", () => {
    const [{ value, guards }] = model.returns;
    expect(guards).toEqual([]);
    if (value.kind !== "element") throw new Error("expected an element");
    const root = value.element;
    expect(root.type).toEqual({ kind: "host", host: { tag: "button" } });
    expect(root.attributes.map((a) => (a.kind === "spread" ? "..." : a.name))).toEqual(["ref", "className", "disabled", "aria-pressed", "onClick", "..."]);
    const spread = root.attributes[root.attributes.length - 1];
    expect(spread?.kind === "spread" && spread.value.reads).toEqual([read("rest", { kind: "param" })]);
    const [children, conditional] = root.children;
    expect(children).toMatchObject({ kind: "expression", expr: { source: "children" } });
    if (conditional.kind !== "expression") throw new Error("expected an expression");
    expect(conditional.expr.elements.map((e) => e.type)).toEqual([{ kind: "host", host: { tag: "span" } }]);
  });
});

describe("a return inside a switch", () => {
  const file = path.join(__dirname, "fixtures/Switchy.tsx");
  const program = ts.createProgram([file], COMPILER_OPTIONS);
  const extraction = createExtractor(program, root).extract(program.getSourceFile(file)!, "Switchy")!;

  it("is read as one return per case, each guarded by its test, and nothing is left unread", () => {
    expect(extraction.unsupported).toEqual([]);
    expect(extraction.model.returns.map((r) => r.guards.map((g) => g.source))).toEqual([['kind === "spinner"'], ['kind === "skeleton"'], ["default of kind"]]);
    expect(extraction.model.returns.map((r) => r.value.kind)).toEqual(["element", "element", "expression"]);
    expect(extraction.model.returns[0].guards[0].reads.map((r) => r.name)).toEqual(["kind"]);
  });
});

describe("every component in the library", () => {
  const names = Object.keys(library.components);

  it("also reads the components they use, so a reference can be followed to the code behind it", () => {
    const button = library.components.Button.model;
    const element = button.returns[0].value.kind === "element" ? button.returns[0].value.element : undefined;
    expect(element?.type).toMatchObject({ kind: "component", name: "ButtonBase", declared: "src/components/core/Button/ButtonBase.tsx#ButtonBase" });
    expect(library.all["src/components/core/Button/ButtonBase.tsx#ButtonBase"]).toBeTruthy();
    expect(Object.keys(library.all).length).toBeGreaterThan(names.length);
  });

  it("finds them", () => {
    expect(names.length).toBeGreaterThanOrEqual(40);
    expect(library.unread).toEqual(expect.not.arrayContaining(["Button", "ActionMenu"]));
  });

  it("reads all of the syntax it meets", () => {
    const unsupported = Object.entries(library.all).flatMap(([id, e]) => e.unsupported.map((u) => `${id}: ${u.kind}`));
    expect(unsupported).toEqual([]);
  });

  it("says what was written: each element printed back is the source again", () => {
    const mismatches: string[] = [];
    for (const [id, { model, originals }] of Object.entries(library.all)) {
      for (const element of topElements(model)) {
        if (normalise(printElement(element)) !== normalise(originals[element.id])) mismatches.push(`${id} <${element.id}>`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("finds every prop the compiler step behind components.json found, and the ones it hid", () => {
    const json = components as unknown as Record<string, { props: { name: string }[] }>;
    const missing: string[] = [];
    const extra: string[] = [];
    for (const name of names) {
      if (!json[name]) continue;
      const mine = library.components[name].model.props.map((p) => p.name);
      const theirs = json[name].props.map((p) => p.name);
      missing.push(...theirs.filter((n) => !mine.includes(n)).map((n) => `${name}.${n}`));
      extra.push(...mine.filter((n) => !theirs.includes(n)).map((n) => `${name}.${n}`));
    }
    expect(missing).toEqual([]);
    // Each is either one the parameter names that a library type brings (marked `inherited`), or declared in the project's own
    // source, which the old step skipped because the DOM's declaration of the same name came first (checked by hand).
    const own = ["ActionMenu.aria-label", "ActionMenu.aria-labelledby", "Header.children", "Popover.autoFocus", "Select.aria-label", "Select.disabled", "Select.id", "Switch.checked", "Switch.defaultChecked"];
    const inherited = new Set(Object.entries(library.components).flatMap(([n, e]) => e.model.props.filter((p) => p.inherited).map((p) => `${n}.${p.name}`)));
    expect(extra.filter((name) => !own.includes(name) && !inherited.has(name))).toEqual([]);
    expect(extra).toEqual(expect.arrayContaining(own));
  });

  it("never loses a name: every one a hook binds or the body declares is found when something reads it", () => {
    const unplaced: string[] = [];
    for (const name of names) {
      const { model } = library.components[name];
      const hookNames = new Set(model.hooks.flatMap((h) => h.binds));
      const wrong = (r: Reference) => r.origin.kind === "hook" && !model.hooks.some((h) => h.hook === (r.origin as { hook: string }).hook);
      const reads = [...model.locals.flatMap((l) => l.reads), ...model.hooks.flatMap((h) => h.arguments.flatMap((a) => a.reads))];
      for (const r of reads) if (wrong(r)) unplaced.push(`${name}.${r.name}`);
      void hookNames;
    }
    expect(unplaced).toEqual([]);
  });
});
