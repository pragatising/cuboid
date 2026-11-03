import { describe, expect, it } from "vitest";
import { applyEdits } from "./edit";
import { readExample } from "./readExample";
import { componentResolver, readImports } from "./resolve";

const file = `import { Menu, Card as Panel } from "@acme/ds";
import * as DS from "@acme/ds";
import Local from "./Local";
import { Other } from "other-lib";

export function Example() {
  return (
    <Menu aria-label="Actions" trigger={<Panel title="x">Open</Panel>}>
      <Menu.Item>Edit</Menu.Item>
      <Menu.Item selected>Copy</Menu.Item>
      <Menu.Item disabled>Delete</Menu.Item>
      <DS.Menu.Item>Namespaced</DS.Menu.Item>
      <Local />
      <Other />
      <div />
    </Menu>
  );
}`;
const known = (id: string) => ["Menu", "Menu.Item", "Card"].includes(id);
const resolve = componentResolver({ fileSource: file, packages: ["@acme/ds"], known });

describe("what the example imports", () => {
  it("reads the names an import binds: named, renamed, namespace and default", () => {
    expect(readImports(file)).toEqual(
      expect.arrayContaining([
        { local: "Menu", from: "@acme/ds", name: "Menu" },
        { local: "Panel", from: "@acme/ds", name: "Card" },
        { local: "DS", from: "@acme/ds", name: "*" },
        { local: "Local", from: "./Local", name: "default" },
      ]),
    );
  });
});

describe("which component a tag is, through the example's own imports", () => {
  const tree = readExample(file, resolve);
  const byTag = Object.fromEntries(tree.instances.map((instance) => [instance.tag, instance.component]));

  it("is the id the package exports it by, whatever it is called in the file", () => {
    expect(byTag.Menu).toBe("Menu");
    expect(byTag.Panel).toBe("Card");
    expect(byTag["Menu.Item"]).toBe("Menu.Item");
    expect(byTag["DS.Menu.Item"]).toBe("Menu.Item");
  });

  it("is nothing for a component from elsewhere, one the example defines, or a host element", () => {
    expect(byTag.Local).toBeUndefined();
    expect(byTag.Other).toBeUndefined();
    expect(byTag.div).toBeUndefined();
  });
});

describe("an edit to one instance", () => {
  const tree = readExample(file, resolve);
  const [first, second, third] = tree.instances.filter((instance) => instance.component === "Menu.Item");

  it("adds an attribute to the instance it names and to none of its siblings, written the same", () => {
    const code = applyEdits(tree, { [first.id]: { disabled: true } });
    expect(code).toContain("<Menu.Item disabled>Edit</Menu.Item>");
    expect(code).toContain("<Menu.Item selected>Copy</Menu.Item>");
    expect(code.match(/disabled/g)).toHaveLength(2);
  });

  it("takes an attribute off one instance and leaves the others as they were", () => {
    const code = applyEdits(tree, { [second.id]: { selected: undefined }, [third.id]: { disabled: undefined } });
    expect(code).toContain("<Menu.Item>Copy</Menu.Item>");
    expect(code).toContain("<Menu.Item>Delete</Menu.Item>");
    expect(code).toContain("<Menu.Item>Edit</Menu.Item>");
  });

  it("changes an attribute that is there, by its own range, and writes text and numbers as code does", () => {
    const code = applyEdits(tree, { "0": { "aria-label": "More", tabIndex: 0 } });
    expect(code).toContain('aria-label="More"');
    expect(code).toContain("tabIndex={0}");
  });

  it("changes nothing when nothing is changed", () => {
    expect(applyEdits(tree, {})).toBe(file);
  });
});
