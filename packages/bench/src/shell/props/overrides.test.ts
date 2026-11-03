// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Node } from "../../engine/types";
import { chosen, setValue, shownValue, withProps } from "./overrides";

const button: Node = { tag: "Button", props: { variant: "primary" }, children: ["Save"] };
const shell: Node = { tag: "Table.Root", children: [{ tag: "Table", props: { lines: "grid" }, children: [{ tag: "Table.Row" }] }] };

describe("the example with what was changed in it", () => {
  it("is the example itself when nothing was changed", () => {
    expect(withProps(button, "Button", {})).toBe(button);
  });

  it("sets a prop, changes one, and takes one off when it is put back", () => {
    expect(withProps(button, "Button", { size: "lg" }).props).toEqual({ variant: "primary", size: "lg" });
    expect(withProps(button, "Button", { variant: "ghost" }).props).toEqual({ variant: "ghost" });
    expect(withProps(button, "Button", { variant: undefined })).toEqual({ tag: "Button", children: ["Save"] });
  });

  it("changes what is between the tags, or removes it", () => {
    expect(withProps(button, "Button", { children: "Send" }).children).toEqual(["Send"]);
    expect(withProps(button, "Button", { children: undefined }).children).toBeUndefined();
  });

  it("changes the component and nothing around it: a shell is as it was", () => {
    const next = withProps(shell, "Table", { lines: "rows" });
    expect(next.tag).toBe("Table.Root");
    expect((next.children as Node[])[0].props).toEqual({ lines: "rows" });
    expect(shell.children).toEqual([{ tag: "Table", props: { lines: "grid" }, children: [{ tag: "Table.Row" }] }]);
  });

  it("does not touch the example it was given", () => {
    withProps(button, "Button", { variant: "ghost", children: "x" });
    expect(button).toEqual({ tag: "Button", props: { variant: "primary" }, children: ["Save"] });
  });
});

describe("what a prop is now", () => {
  it("is what was changed to, else what the example sets, else nothing", () => {
    expect(setValue("variant", button, { variant: "ghost" })).toBe("ghost");
    expect(setValue("variant", button, {})).toBe("primary");
    expect(setValue("size", button, {})).toBeUndefined();
    expect(setValue("children", button, {})).toEqual(["Save"]);
  });

  it("is nothing once it was put back, even if the example sets it", () => {
    expect(setValue("variant", button, { variant: undefined })).toBeUndefined();
  });

  it("shows the default the types say when nothing sets it", () => {
    expect(shownValue("size", button, {}, '"md"')).toBe("md");
    expect(shownValue("size", button, { size: "lg" }, '"md"')).toBe("lg");
    expect(shownValue("loading", button, {}, "false")).toBe(false);
  });
});

describe("choosing a value", () => {
  it("does not write the default down", () => {
    expect(chosen("md", '"md"', button, "size")).toBeUndefined();
    expect(chosen("lg", '"md"', button, "size")).toBe("lg");
  });

  it("writes it down when the example itself sets the prop, so going back to the default is a change", () => {
    expect(chosen("secondary", '"secondary"', button, "variant")).toBe("secondary");
  });
});
