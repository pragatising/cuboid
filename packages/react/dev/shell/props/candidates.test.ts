import { describe, expect, it } from "vitest";
import { anatomyExample, composeExamples } from "../playground/compose";
import { nameOf, slotCandidates } from "./candidates";

const base = (name: string) => anatomyExample(composeExamples(name))!.node;

describe("what can go in a slot", () => {
  it("is text, and the components that fit by the HTML content model", () => {
    const names = slotCandidates("Button", base("Button"), "leadingVisual").map((c) => c.id);
    expect(names).toContain("text");
    expect(names).toContain("Icon");
    expect(names).toContain("Pill");
  });

  it("leaves out what does not fit: a table in a button, and another button", () => {
    const names = slotCandidates("Button", base("Button"), "leadingVisual").map((c) => c.id);
    expect(names).not.toContain("Table");
    expect(names).not.toContain("Button");
    expect(names).not.toContain("Header");
  });

  it("never offers the component itself, nor one that cannot be drawn alone", () => {
    const names = slotCandidates("ActionMenu", base("ActionMenu"), "trigger").map((c) => c.id);
    expect(names).not.toContain("ActionMenu");
    expect(names).toContain("Button");
    expect(names).toContain("IconButton");
  });

  it("offers a slot that must be one control only controls: a button, a link, a pill made a button; not a sheet, a layout or text", () => {
    const element = slotCandidates("ActionMenu", base("ActionMenu"), "trigger", true);
    const names = element.map((c) => c.id);
    expect(names).toEqual(expect.arrayContaining(["Button", "IconButton", "Link", "Pill"]));
    for (const unwanted of ["text", "Sheet", "Overlay", "SplitLayout", "Sidebar", "Box", "Heading", "Container"]) expect(names).not.toContain(unwanted);
    expect(element.find((c) => c.id === "Pill")?.value).toMatchObject({ tag: "Pill", props: { as: "button" } });
  });

  it("gives each candidate as the node that would be written", () => {
    const icon = slotCandidates("Button", base("Button"), "leadingVisual").find((c) => c.id === "Icon");
    expect(icon?.value).toMatchObject({ tag: "Icon", props: { name: "add" } });
  });
});

describe("what a slot's content is called", () => {
  it("is the component in it, Text for text, nothing for nothing", () => {
    expect(nameOf({ tag: "Icon" })).toBe("Icon");
    expect(nameOf("Label")).toBe("Text");
    expect(nameOf([{ tag: "Pill" }])).toBe("Pill");
    expect(nameOf(undefined)).toBeNull();
  });
});
