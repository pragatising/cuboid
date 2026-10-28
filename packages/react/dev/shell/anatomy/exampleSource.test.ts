import { describe, expect, it } from "vitest";
import {
  exampleCode,
  exampleNames,
  importsFor,
  parseImports,
} from "./exampleSource";

const file = `import { useState } from "react";
import { ActionMenu, Button, Switch } from "@sragatiping/cuboid";
import type { ButtonProps } from "@sragatiping/cuboid";
import Thing from "./thing";

export function Default() {
  return (
    <ActionMenu trigger={<Button onClick={() => go(a > b)}>Actions</Button>}>
      <ActionMenu.Item>Edit</ActionMenu.Item>
    </ActionMenu>
  );
}

export function Controlled({ start = false }: { start?: boolean }) {
  const [on, setOn] = useState(start);
  return <Switch checked={on} onCheckedChange={setOn} label="On" />;
}
`;

describe("exampleCode", () => {
  it("shows the function verbatim, with only the imports its body mentions", () => {
    const example = exampleCode(file, "Controlled")!;
    expect(example.code.split("\n").slice(0, 3)).toEqual([
      'import { useState } from "react";',
      'import { Switch } from "@sragatiping/cuboid";',
      "",
    ]);
    expect(example.code).toContain(
      "export function Controlled({ start = false }: { start?: boolean }) {",
    );
    expect(example.code.trimEnd().endsWith("}")).toBe(true);
    expect(example.code).not.toContain("ActionMenu");
    expect(example.code).not.toContain("Thing");
  });

  it("cuts an import statement down to the names that are used", () => {
    const example = exampleCode(file, "Default")!;
    expect(example.code).toContain(
      'import { ActionMenu, Button } from "@sragatiping/cuboid";',
    );
    expect(example.code).not.toContain("useState");
  });

  it("is not thrown by an arrow or a comparison, and ends at the function's own closing brace", () => {
    const example = exampleCode(file, "Default")!;
    expect(example.code).toContain("onClick={() => go(a > b)}");
    expect(example.code).not.toContain("Controlled");
  });

  it("keeps the function's lines, and says which line of the file each came from", () => {
    const example = exampleCode(file, "Default")!;
    const lines = example.code.split("\n");
    const at = lines.findIndex((line) =>
      line.startsWith("export function Default"),
    );
    expect(example.lineMap[at]).toBe(6);
    expect(file.split("\n")[example.lineMap[at]! - 1]).toBe(lines[at]);
    // A made line (an import, the blank after them) has no place in the file.
    expect(example.lineMap[0]).toBeNull();
    expect(example.lineMap[at - 1]).toBeNull();
  });

  it("has nothing for an example that is not there", () => {
    expect(exampleCode(file, "Missing")).toBeNull();
  });
});

describe("parseImports and importsFor", () => {
  it("reads default, named, aliased, namespace and type imports", () => {
    const imports = parseImports(
      `import A, { b, c as d } from "x";\nimport * as e from "y";\nimport type { F } from "z";`,
    );
    expect(imports[0]).toMatchObject({ defaultName: "A", from: "x" });
    expect(imports[0].named).toEqual([
      { imported: "b", local: "b" },
      { imported: "c", local: "d" },
    ]);
    expect(imports[1]).toMatchObject({ namespace: "e" });
    expect(imports[2]).toMatchObject({ typeOnly: true });
    expect(importsFor(imports, "d(A, e.x)")).toEqual([
      'import A, { c as d } from "x";',
      'import * as e from "y";',
    ]);
  });

  it("does not count a property access as a use of a name", () => {
    expect(
      importsFor(parseImports('import { Box } from "x";'), "foo.Box"),
    ).toEqual([]);
  });
});

describe("exampleNames", () => {
  it("lists the exported examples in order", () => {
    expect(exampleNames(file)).toEqual(["Default", "Controlled"]);
  });
});
