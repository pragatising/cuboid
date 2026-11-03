import { describe, expect, it } from "vitest";
import { instanceAt, instancesOf, readExample } from "./readExample";

const menu = `export function Default() {
  const [open, setOpen] = useState(false);
  return (
    <Menu trigger={<Action size="md">Actions</Action>} aria-label="Actions" closeOnSelect={false} onSelect={() => setOpen(false)} defaultOpen>
      <Menu.Header onClose={() => setOpen(false)}>Filter</Menu.Header>
      <Menu.Item selected>Edit</Menu.Item>
      <Menu.Item disabled>Delete</Menu.Item>
      <Menu.Search aria-label="Filter" />
      {matches.map((name) => <Menu.Item key={name}>{name}</Menu.Item>)}
    </Menu>
  );
}`;

describe("the tree of an example", () => {
  const tree = readExample(menu);

  it("starts at the first element the example writes, and addresses every element", () => {
    expect(tree.root?.tag).toBe("Menu");
    expect(tree.root?.id).toBe("0");
    expect(tree.instances.map((i) => `${i.id} ${i.tag}`)).toEqual(["0 Menu", "0@trigger Action", "0.0 Menu.Header", "0.1 Menu.Item", "0.2 Menu.Item", "0.3 Menu.Search"]);
  });

  it("reads a prop as it is written: a literal, an element, or code", () => {
    const props = tree.root!.props;
    expect(props["aria-label"]).toMatchObject({ kind: "literal", value: "Actions" });
    expect(props.closeOnSelect).toMatchObject({ kind: "literal", value: false, source: "false" });
    expect(props.defaultOpen).toMatchObject({ kind: "literal", value: true, source: "" });
    expect(props.trigger).toMatchObject({ kind: "element", source: '<Action size="md">Actions</Action>' });
    expect(props.onSelect).toMatchObject({ kind: "expression", source: "() => setOpen(false)" });
  });

  it("keeps an element written as a prop as an instance of its own, with its own props and text", () => {
    const trigger = instanceAt(tree, "0@trigger");
    expect(trigger?.props.size).toMatchObject({ kind: "literal", value: "md" });
    expect(trigger?.children).toEqual([{ kind: "text", text: "Actions" }]);
  });

  it("tells repeated elements apart: each item has its own props", () => {
    const items = instancesOf(tree, "Menu.Item");
    expect(items.map((i) => i.id)).toEqual(["0.1", "0.2"]);
    expect(Object.keys(items[0].props)).toEqual(["selected"]);
    expect(Object.keys(items[1].props)).toEqual(["disabled"]);
  });

  it("keeps what needs running as the code that writes it, in its place among the children", () => {
    expect(tree.root?.children.map((child) => ("id" in child ? child.tag : child.kind))).toEqual(["Menu.Header", "Menu.Item", "Menu.Item", "Menu.Search", "expression"]);
    expect(tree.root?.children.at(-1)).toEqual({ kind: "expression", source: "matches.map((name) => <Menu.Item key={name}>{name}</Menu.Item>)" });
  });

  it("has the lines between the tags as written, with their shared indent taken off", () => {
    expect(tree.root?.childrenSource?.split("\n")[0]).toBe("<Menu.Header onClose={() => setOpen(false)}>Filter</Menu.Header>");
  });

  it("reads a self-closing element as an element with no content", () => {
    const search = instanceAt(tree, "0.3");
    expect(search).toMatchObject({ tag: "Menu.Search", selfClosing: true, children: [] });
    expect(readExample("export const A = () => <Icon name=\"add\" />;").root).toMatchObject({ tag: "Icon", selfClosing: true });
  });

  it("knows where each attribute is, so it can be changed in the text", () => {
    const { from, to } = tree.root!.props.closeOnSelect;
    expect(menu.slice(from, to)).toBe("closeOnSelect={false}");
  });

  it("reads nothing from text with no element", () => {
    expect(readExample("export const x = 1;")).toMatchObject({ root: undefined, instances: [] });
  });
});
