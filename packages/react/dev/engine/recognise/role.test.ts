// @vitest-environment node
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractLibrary } from "../extract/extractLibrary";
import { roleOf } from "./role";

const root = path.resolve(__dirname, "../../..");
const library = extractLibrary(path.join(root, "src/index.ts"), root);
const models = Object.fromEntries(Object.entries(library.all).map(([id, e]) => [id, e.model]));
const role = (name: string) => roleOf(library.components[name].model, models);
const part = (name: string, member: string) => {
  const declared = library.components[name].model.statics.find((s) => s.name === member)?.declared;
  return declared ? roleOf(models[declared], models) : null;
};

describe("a component's ARIA role, read from the element the caller's props land on", () => {
  it("takes the role the element implies", () => {
    expect(role("Button")).toMatchObject({ role: "button", source: "implicit", category: "widget", host: "button" });
    expect(role("Header")).toMatchObject({ role: "banner", category: "landmark" });
    expect(role("Sidebar")).toMatchObject({ role: "navigation", category: "landmark" });
    expect(role("Heading")).toMatchObject({ role: "heading", host: "h2" });
    expect(role("Divider")?.role).toBe("separator");
  });

  it("takes the role the code names", () => {
    expect(role("Switch")).toMatchObject({ role: "switch", source: "explicit", category: "widget" });
  });

  it("reads through the components it renders, to the element that is the component", () => {
    // Button renders ButtonBase, which renders `<Component>` where the tag is chosen by `as`.
    expect(role("Button")?.host).toBe("button");
    // InputText renders a wrapper and a help button first; the element that gets its props is the input.
    expect(role("InputText")).toMatchObject({ role: "textbox", host: "input" });
    expect(role("TextArea")?.role).toBe("textbox");
    expect(role("Select")?.role).toBe("combobox");
  });

  it("says where the accessible name comes from, so an example knows a label is needed", () => {
    expect(role("InputText")?.nameFrom).toEqual(["author"]);
    expect(role("Button")?.nameFrom).toEqual(expect.arrayContaining(["contents"]));
  });

  it("says what a role must hold and what it must sit in", () => {
    expect(role("Table")?.owns).toEqual(expect.arrayContaining(["row", "rowgroup"]));
    expect(part("Table", "Row")).toMatchObject({ role: "row" });
    expect(part("Table", "Cell")?.within).toEqual(expect.arrayContaining(["row"]));
  });

  it("names every role the code chooses between", () => {
    const item = part("ActionMenu", "Item");
    expect(item?.roles).toEqual(expect.arrayContaining(["option", "menuitem", "menuitemradio", "menuitemcheckbox"]));
    expect(item?.within.length).toBeGreaterThan(0);
    // The list's role is the default of its `role` parameter, and a `menu` owns menu items.
    expect(part("ActionMenu", "List")?.owns).toEqual(expect.arrayContaining(["menuitem"]));
  });

  it("gives `generic` when nothing says more, and nothing when it renders no element it can read", () => {
    expect(role("Box")).toMatchObject({ role: "generic", category: "generic" });
    expect(role("Popover")).toBeNull();
  });
});
