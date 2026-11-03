import { describe, expect, it } from "vitest";
import { componentCompletions, componentNames, propsOf, template } from "./completions";
import type { PropInfo } from "./completions";
import { complete, env, labels } from "./testing";

const source = componentCompletions(env);
const prop = (extra: Partial<PropInfo>): PropInfo => ({ name: "x", type: "string", required: false, kind: "other", values: [], ...extra });

// What the models say, read the same way the suggestions are, so these do not repeat the data.
const enumProp = (tag: string) => propsOf(env, tag).find((p) => p.kind === "enum" && p.values.length > 1)!;
const required = (tag: string) => propsOf(env, tag).filter((p) => p.required && p.name !== "children");

describe("the names of components", () => {
  it("are every exported component, and the parts the models say it has", () => {
    const names = componentNames(env);
    expect(names).toEqual(expect.arrayContaining(["Button", "Box", "ActionMenu", "ActionMenu.Item"]));
    expect(names.every((n) => n === n.trim() && !n.endsWith("."))).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("after <", () => {
  it("offers the components, replacing what was typed after the bracket", async () => {
    const result = await complete(source, "const a = <Bu|");
    expect(labels(result)).toEqual(expect.arrayContaining(["Button", "ActionMenu.Item"]));
    expect(result!.from).toBe("const a = <".length);
  });

  it("offers them on a bare <, and puts the parts after the whole components", async () => {
    const result = await complete(source, "const a = <|");
    const all = labels(result);
    expect(all.length).toBeGreaterThan(20);
    const boosts = Object.fromEntries(result!.options.map((o) => [o.label, o.boost ?? 0]));
    expect(boosts["ActionMenu.Item"]).toBeLessThan(boosts["ActionMenu"]);
  });

  it("does not offer anything for a less-than sign that is a comparison", async () => {
    expect(await complete(source, "const a = b <|")).toBeNull();
    expect(await complete(source, "if (items.length <|")).toBeNull();
    expect(await complete(source, "const a = f(1) <|")).toBeNull();
  });

  it("does offer them where an expression starts: after return, a bracket, an arrow, an equals sign", async () => {
    for (const before of ["return", "return (", "const a =", "items.map((i) =>", "cond ? ", "cond &&", "{ ok: "]) {
      expect(labels(await complete(source, `${before} <|`)), before).toContain("Button");
    }
  });

  it("offers them among an element's children, after text or another element", async () => {
    expect(labels(await complete(source, "const a = (\n  <Box>\n    <Text>Hi</Text>\n    <|\n  </Box>\n);"))).toContain("Button");
    expect(labels(await complete(source, "const a = <Box>Save <|</Box>;"))).toContain("Button");
  });
});

describe("inside an opening tag", () => {
  it("offers the props of that component, from its model", async () => {
    const all = labels(await complete(source, "const a = <Button |", true));
    for (const p of propsOf(env, "Button").filter((p) => p.name !== "children" && p.name !== "ref")) expect(all, p.name).toContain(p.name);
  });

  it("filters as you type, from the start of the word", async () => {
    const typed = enumProp("Button").name.slice(0, 2);
    const result = await complete(source, `const a = <Button ${typed}|`);
    expect(result!.from).toBe(`const a = <Button `.length);
    expect(labels(result)).toContain(enumProp("Button").name);
  });

  it("leaves out the props already written", async () => {
    const name = enumProp("Button").name;
    const all = labels(await complete(source, `const a = <Button ${name}="x" |`, true));
    expect(all).not.toContain(name);
    expect(all.length).toBeGreaterThan(3);
  });

  it("finds the component of a part, such as ActionMenu.Item", async () => {
    const all = labels(await complete(source, "const a = <ActionMenu.Item |", true));
    expect(all.length).toBeGreaterThan(0);
    for (const p of propsOf(env, "ActionMenu.Item").filter((p) => p.name !== "children" && p.name !== "ref").slice(0, 3)) expect(all).toContain(p.name);
  });

  it("works while the tag is still open, with the rest of the file unfinished", async () => {
    expect(labels(await complete(source, "function A() { return <Button va| }"))).toContain("variant");
  });

  it("puts the required props first", async () => {
    const tag = ["IconButton", "Switch", "Tooltip", "Icon", "Select"].find((t) => required(t).length)!;
    const result = await complete(source, `const a = <${tag} |`, true);
    const boost = (name: string) => result!.options.find((o) => o.label === name)!.boost ?? 0;
    for (const p of required(tag)) expect(boost(p.name), p.name).toBeGreaterThan(0);
  });

  it("shows what a prop's type is and says when it is required", async () => {
    const tag = ["IconButton", "Switch", "Tooltip", "Icon", "Select"].find((t) => required(t).length)!;
    const result = await complete(source, `const a = <${tag} |`, true);
    const one = result!.options.find((o) => o.label === required(tag)[0].name)!;
    expect(one.detail).toMatch(/required/);
  });

  it("offers nothing for a tag it does not know", async () => {
    expect(await complete(source, "const a = <Nonesuch |", true)).toBeNull();
  });
});

describe("the value of an enum prop", () => {
  it("offers its values inside the quotes, replacing what is typed", async () => {
    const p = enumProp("Button");
    const result = await complete(source, `const a = <Button ${p.name}="|"`);
    expect(labels(result)).toEqual(p.values.map(String));
    expect(result!.from).toBe(`const a = <Button ${p.name}="`.length);
  });

  it("narrows to the values that start as typed, and puts the default first", async () => {
    const p = enumProp("Button");
    const first = String(p.values[0]);
    const result = await complete(source, `const a = <Button ${p.name}="${first.slice(0, 1)}|"`);
    expect(result!.from).toBe(`const a = <Button ${p.name}="`.length);
    const def = p.default?.replace(/"/g, "");
    if (def) expect(result!.options.find((o) => o.label === def)?.boost).toBe(1);
  });

  it("offers nothing inside a value that is not an enum, or inside braces", async () => {
    expect(await complete(source, 'const a = <Button aria-label="|"')).toBeNull();
    expect(await complete(source, "const a = <Button onClick={|}")).toBeNull();
  });
});

describe("outside JSX", () => {
  it("offers nothing", async () => {
    expect(await complete(source, "const a = |", true)).toBeNull();
    expect(await complete(source, "function A() { return 1 + | }")).toBeNull();
  });
});

describe("how a prop is written when it is chosen", () => {
  it("is a flag by its name alone", () => expect(template(prop({ name: "disabled", kind: "flag" }))).toBe("disabled"));
  it("is an enum or open text in quotes, the cursor between them", () => {
    expect(template(prop({ name: "variant", kind: "enum" }))).toBe('variant="${}"');
    expect(template(prop({ name: "title", kind: "open" }))).toBe('title="${}"');
  });
  it("is anything else in braces", () => {
    expect(template(prop({ name: "onClick", kind: "event" }))).toBe("onClick={${}}");
    expect(template(prop({ name: "icon", kind: "slot" }))).toBe("icon={${}}");
  });
});
