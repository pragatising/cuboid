import { describe, expect, it } from "vitest";
import { locate, sourceFilesOf } from "./sourceFiles";

const load = async () => "";
const files = Object.fromEntries(
  [
    "src/components/core/Button/Button.tsx",
    "src/components/core/Button/ButtonBase.tsx",
    "src/components/core/Button/types.ts",
    "src/components/core/Button/ButtonBase.module.css",
    "src/components/core/Button/index.ts",
    "src/components/core/Table/Table.tsx",
    "src/components/core/Table/TableCell/TableCell.tsx",
  ].map((path) => [`~bench/0/${path}`, load]),
);
const ids = {
  Button: "src/components/core/Button/Button.tsx#Button",
  Table: "src/components/core/Table/Table.tsx#Table",
  ButtonBase: "src/components/core/Button/ButtonBase.tsx#ButtonBase",
};

describe("the files of a component's folder", () => {
  it("are its tabs: the component's own first, then the other components, the code, the styles", () => {
    expect(sourceFilesOf("Button", files, ids).map((file) => file.name)).toEqual(["Button.tsx", "ButtonBase.tsx", "index.ts", "types.ts", "ButtonBase.module.css"]);
  });

  it("are the folder's own: what is in a folder inside it belongs to the part that has it", () => {
    expect(sourceFilesOf("Table", files, ids).map((file) => file.name)).toEqual(["Table.tsx"]);
  });

  it("say what each is, for its icon", () => {
    expect(sourceFilesOf("Button", files, ids).map((file) => file.kind)).toEqual(["react", "react", "ts", "ts", "css"]);
  });

  it("are none for a component that is not written anywhere known", () => {
    expect(sourceFilesOf("Nothing", files, ids)).toEqual([]);
  });
});

describe("a link to a component's source", () => {
  it("is the page whose folder has the file, and the file: ButtonBase is in Button's", () => {
    expect(locate("src/components/core/Button/ButtonBase.tsx#ButtonBase", ids)).toEqual({ component: "Button", file: "ButtonBase.tsx" });
  });

  it("is the component's own page for the component's own file", () => {
    expect(locate("src/components/core/Table/Table.tsx#Table", ids)).toEqual({ component: "Table", file: "Table.tsx" });
  });

  it("goes nowhere when no page has that folder, or there is no place", () => {
    expect(locate("src/utils/helper.ts#helper", ids)).toBeNull();
    expect(locate(undefined, ids)).toBeNull();
  });
});
