// @vitest-environment node
import { transformSync } from "esbuild";
import { describe, expect, it } from "vitest";
import { componentResolver } from "./resolve";
import { exampleText } from "./text";
import { readExample } from "./readExample";
import { lineColumn, positionsOf } from "./positions";

const file = `import { Menu, Card } from "@x/lib";

export function First() {
  return <Card title="one" />;
}

export function Second() {
  return (
    <Menu dense trigger={<button>Open</button>}>
      <Menu.Item>One</Menu.Item>
      <Menu.Item selected>Two</Menu.Item>
      <Menu.Item>Three</Menu.Item>
    </Menu>
  );
}
`;

describe("where an instance is written in the file", () => {
  it("counts lines and columns from 1", () => {
    expect(lineColumn("ab\n  cd", 0)).toEqual({ line: 1, column: 1 });
    expect(lineColumn("ab\n  cd", 5)).toEqual({ line: 2, column: 3 });
  });

  it("is the place the JSX transform in development reports for the element it makes: that is how a compiled example is matched to its tree", () => {
    const written = exampleText(file, "Second")!;
    const tree = readExample(written, componentResolver({ fileSource: file, packages: ["@x/lib"], known: () => true }));
    const positions = positionsOf(tree, file);
    // Run the compiled example with a runtime that only notes where each element it makes is written.
    const code = transformSync(file, { loader: "tsx", jsx: "automatic", jsxDev: true, jsxImportSource: "bench-jsx", format: "cjs", sourcefile: "A.tsx" }).code;
    const reported: string[] = [];
    const library = { Menu: Object.assign(() => null, { Item: () => null }), Card: () => null };
    const runtime = { jsxDEV: (_type: unknown, _props: unknown, _key: unknown, _static: unknown, source: { lineNumber: number; columnNumber: number }) => (reported.push(`${source.lineNumber}:${source.columnNumber}`), null) };
    const compiled: { exports: Record<string, () => unknown> } = { exports: {} };
    new Function("require", "exports", "module", code)((name: string) => (name === "@x/lib" ? library : runtime), compiled.exports, compiled);
    compiled.exports.Second();
    // Every element the example writes is reported at the place its instance is said to be, and nothing else is.
    expect([...reported].sort()).toEqual(Object.values(positions).sort());
    // The three items, written alike, each have a place of their own.
    const items = tree.instances.filter((instance) => instance.tag === "Menu.Item").map((instance) => positions[instance.id]);
    expect(new Set(items).size).toBe(3);
  });

  it("says nothing for a tree that is not in the file", () => {
    expect(positionsOf(readExample("export const A = () => <b />;"), file)).toEqual({});
  });
});
