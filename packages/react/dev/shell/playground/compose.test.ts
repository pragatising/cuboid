import { describe, expect, it } from "vitest";
import { anatomyExample, composeExamples } from "./compose";

const exampleOf = (name: string) => anatomyExample(composeExamples(name))!;

describe("the example a component is drawn from", () => {
  it("is the same example each time it is asked for, so nothing that depends on it sees it change (a Pill looped the page until it unmounted)", () => {
    for (const name of ["Pill", "ActionMenu", "Button", "Table"]) {
      const composed = composeExamples(name);
      expect(anatomyExample(composed)).toBe(anatomyExample(composed));
    }
  });

  it("is the component as it is by default, not with its flags turned the other way for coverage", () => {
    const props = exampleOf("ActionMenu").node.props ?? {};
    for (const flag of ["dismissible", "returnFocusOnClose", "closeOnSelect", "autoFocusFirstItem", "matchAnchorWidth"]) expect(flag in props).toBe(false);
    expect("placement" in props).toBe(false);
  });

  it("has the most the component can show: a menu has its list and several items, a form field its label", () => {
    const menu = JSON.stringify(exampleOf("ActionMenu").node);
    expect(menu).toContain("ActionMenu.List");
    expect((menu.match(/ActionMenu\.Item/g) ?? []).length).toBeGreaterThan(1);
    expect(exampleOf("InputText").node.props).toHaveProperty("label");
  });

  it("is never in a state of its own", () => {
    expect(exampleOf("Button").node.props ?? {}).not.toHaveProperty("disabled");
    expect(exampleOf("Button").node.props ?? {}).not.toHaveProperty("loading");
  });

  it("keeps the shell around a component that has one, and is as valid as any example", () => {
    expect(exampleOf("Table").node.tag).toBe("Table.Root");
    expect(exampleOf("ActionMenu").issues).toEqual([]);
  });
});
