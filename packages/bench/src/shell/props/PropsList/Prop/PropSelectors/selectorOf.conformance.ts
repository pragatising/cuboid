import { describe, expect, it } from "vitest";
import components from "~bench/generated/components.json";
import type { PropInfo } from "../types";
import { selectorOf } from "./selectorOf";

const prop = (over: Partial<PropInfo>): PropInfo => ({ name: "p", type: "x", kind: "other", ...over });
const library = components as unknown as Record<string, { props: PropInfo[] }>;
const named = (component: string, name: string) => library[component].props.find((p) => p.name === name) as PropInfo;

describe("which selector a prop has", () => {
  it("maps each kind of type to the Figma's selector", () => {
    expect(selectorOf(prop({ kind: "flag" }))).toBe("boolean");
    expect(selectorOf(prop({ kind: "enum", values: ["sm", "md", "lg"] }))).toBe("enum");
    expect(selectorOf(prop({ kind: "enum", values: ["a", "b", "c", "d", "e"] }))).toBe("token");
    expect(selectorOf(prop({ kind: "slot", type: "React.ReactNode" }))).toBe("react");
    expect(selectorOf(prop({ kind: "event", type: "(open: boolean) => void" }))).toBe("function");
    expect(selectorOf(prop({ kind: "value", type: "string" }))).toBe("string");
    expect(selectorOf(prop({ kind: "value", type: "number" }))).toBe("number");
  });

  it("a type made of parts is a token for one set, tokens for several", () => {
    expect(selectorOf(prop({ kind: "other", members: [{ name: "Length", set: "Length", free: ["text"] }] }))).toBe("token");
    expect(selectorOf(prop({ kind: "open", members: [{ name: "FgColor", set: "FgColor" }, { name: "CssColor", free: ["text"] }] }))).toBe("tokenSets");
  });

  it("what has no control is its type, written out", () => {
    expect(selectorOf(prop({ kind: "ref", type: "RefObject<HTMLElement | null>" }))).toBe("type");
    expect(selectorOf(prop({ kind: "other", type: "SwatchGroup[]" }))).toBe("type");
    expect(selectorOf(prop({ kind: "function", type: "SomethingUnreadable" }))).toBe("type");
  });

  it("reads the library: a length is a token with a typed part, not the word Length", () => {
    expect(selectorOf(named("ActionMenu", "minWidth"))).toBe("token");
    expect(selectorOf(named("ActionMenu", "anchorRef"))).toBe("type");
    expect(selectorOf(named("ActionMenu", "trigger"))).toBe("react");
    expect(selectorOf(named("ActionMenu", "open"))).toBe("boolean");
    expect(selectorOf(named("ActionMenu", "onOpenChange"))).toBe("function");
  });
});
