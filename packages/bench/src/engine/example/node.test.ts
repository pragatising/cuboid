import { describe, expect, it } from "vitest";
import { nodeOf, writtenOf } from "./node";
import { readExample } from "./readExample";
import { exampleText } from "./text";

const file = `import { Table } from "@x/lib";

const rows = [1, 2];

export function Default() {
  return (
    <Table>
      <Table.Body />
    </Table>
  );
}

export function Truncated() {
  return (
    <div>
      <Table rowLayout="truncate" layout={"scroll"} density="dense" lines={pick} n={3} off={false} loading label={\`plain\`}>
        <Table.Body />
      </Table>
      <Table density="spacious" />
    </div>
  );
}

export const Arrow = () => <Table lines="none" />;
`;

const firstOf = (name: string, tag = "Table") => readExample(exampleText(file, name)!).instances.find((instance) => instance.tag === tag)!;

describe("an example's text", () => {
  it("is the exported function of that name, as written", () => {
    expect(exampleText(file, "Default")).toMatch(/^export function Default\(\) \{[\s\S]*\}$/);
    expect(exampleText(file, "Default")).not.toContain("Truncated");
  });

  it("finds an exported constant too, and says nothing for a name the file does not have", () => {
    expect(exampleText(file, "Arrow")).toBe('export const Arrow = () => <Table lines="none" />;');
    expect(exampleText(file, "Missing")).toBeUndefined();
    expect(exampleText(file, "rows")).toBeUndefined();
  });
});

describe("an instance as the node it draws", () => {
  it("has nothing for an example that sets nothing", () => {
    expect(nodeOf(firstOf("Default")).props).toBeUndefined();
  });

  it("reads quoted text, braced literals, numbers, booleans and a bare attribute", () => {
    expect(nodeOf(firstOf("Truncated")).props).toEqual({ rowLayout: "truncate", layout: "scroll", density: "dense", n: 3, off: false, loading: true, label: "plain" });
  });

  it("knows an attribute set to an expression is set, without knowing to what", () => {
    const instance = firstOf("Truncated");
    expect(instance.props.lines).toMatchObject({ kind: "expression", source: "pick" });
    expect(nodeOf(instance).props).not.toHaveProperty("lines");
  });

  it("reads an element written in a prop as the node it draws", () => {
    const source = 'export function A() { return <Menu trigger={<Button variant="primary">Actions</Button>} icon={<Icon />} />; }';
    expect(nodeOf(readExample(source).root!).props).toEqual({ trigger: { tag: "Button", props: { variant: "primary" }, children: ["Actions"] }, icon: { tag: "Icon" } });
  });

  it("names the tag as asked: a component imported under another name is drawn as what it is", () => {
    expect(nodeOf(firstOf("Default"), "Grid").tag).toBe("Grid");
  });
});

describe("what an instance writes, as code", () => {
  it("is each attribute as it is written, and the lines between its tags", () => {
    const source = 'export function A() { return <Menu size="md" dense onClose={() => stop()} trigger={<Button>Open</Button>}>\n  <Menu.Item>One</Menu.Item>\n  <Menu.Item>Two</Menu.Item>\n</Menu>; }';
    expect(writtenOf(readExample(source).root!)).toEqual({
      size: '"md"',
      dense: "",
      onClose: "() => stop()",
      trigger: "<Button>Open</Button>",
      children: "<Menu.Item>One</Menu.Item>\n<Menu.Item>Two</Menu.Item>",
    });
  });

  it("is only the text of the content when that is all there is", () => {
    expect(writtenOf(readExample('export const A = () => <Button>Save</Button>;').root!)).toEqual({ children: "Save" });
  });
});
