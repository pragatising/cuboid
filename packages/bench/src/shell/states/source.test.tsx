import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadPreviewSource } from "./source";

describe("the example a component is drawn from", () => {
  it("is composed by the engine, with no story or example file written for it", async () => {
    const source = await loadPreviewSource("Switch");
    expect(source?.example?.code).toContain("<Switch");
  });

  it("is there for a component with parts, such as the editor", async () => {
    const source = await loadPreviewSource("Editor");
    expect(source?.example?.code).toContain("<Editor");
  });
});

describe("the example with what the pane has changed in it", () => {
  it("is printed again with the changes written in, and as it was with none", async () => {
    const source = await loadPreviewSource("Editor");
    expect(source?.codeWith({})?.code).toBe(source?.example?.code);
    expect(source?.codeWith({ title: "Quarterly plan" })?.code).toContain('title="Quarterly plan"');
    expect(source?.codeWith({ readOnly: true })?.code).toContain("readOnly");
  });

  it("gives the pane what it plays with: the component's props and the example's node", async () => {
    const source = await loadPreviewSource("Editor");
    expect(source?.play?.node.tag).toBe("Editor");
    expect(source?.play?.doc.props.some((prop) => prop.name === "title")).toBe(true);
  });
});

describe("a group of states", () => {
  it("sits on its frame with no border or ground of its own: the frame already is one", () => {
    const css = readFileSync("src/shell/states/Group.module.css", "utf8");
    const card = /\.Card \{([^}]*)\}/.exec(css)![1];
    expect(card).not.toMatch(/(^|[\s;])(border(-[a-z]+)*|background(-[a-z]+)*)\s*:/);
  });
});
