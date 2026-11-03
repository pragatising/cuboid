import { describe, expect, it } from "vitest";
import { propsOf } from "./completions";
import { suggestRequiredProp } from "./suggest";
import { env } from "./testing";

const ask = (marked: string) => {
  const pos = marked.indexOf("|");
  return suggestRequiredProp(env)({ doc: marked.replace("|", ""), pos, signal: new AbortController().signal });
};
const needs = (tag: string) => propsOf(env, tag).filter((p) => p.required && p.name !== "children");
const tag = ["IconButton", "Switch", "Tooltip", "Icon", "Select"].find((t) => needs(t).length)!;

describe("suggesting the next required prop", () => {
  it("proposes the first prop the component requires and the element does not have", async () => {
    const text = await ask(`const a = <${tag}|`);
    expect(text).toContain(needs(tag)[0].name);
    expect(text!.startsWith(" ")).toBe(true);
  });

  it("does not add a space where there already is one", async () => {
    expect((await ask(`const a = <${tag} |`))!.startsWith(" ")).toBe(false);
  });

  it("moves on to the next once one is written, and stops when all are", async () => {
    const [first, second] = needs(tag);
    if (second) expect(await ask(`const a = <${tag} ${first.name}="x" |`)).toContain(second.name);
    const all = needs(tag).map((p) => `${p.name}="x"`).join(" ");
    expect(await ask(`const a = <${tag} ${all} |`)).toBeNull();
  });

  it("gives an enum prop the value its model implies: the default, or the first value", async () => {
    const withEnum = ["Switch", "Select", "Tooltip", "Overlay", "Sheet", "Popover", "SplitLayout"].find((t) => needs(t).some((p) => p.kind === "enum"));
    if (!withEnum) return;
    const p = needs(withEnum).find((x) => x.kind === "enum")!;
    const text = await ask(`const a = <${withEnum} |`);
    if (text?.includes(p.name)) expect(text).toContain(`${p.name}="${p.default?.replace(/"/g, "") || p.values[0]}"`);
  });

  it("proposes nothing outside an opening tag, or inside a value, or for a component it does not know", async () => {
    expect(await ask("const a = |")).toBeNull();
    expect(await ask(`const a = <${tag} label="|"`)).toBeNull();
    expect(await ask("const a = <Nonesuch |")).toBeNull();
    expect(await ask(`const a = <${tag}>text|`)).toBeNull();
  });
});
