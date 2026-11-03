import { describe, expect, it } from "vitest";
import { attributesOf, elementAt, openTagAt, tagName } from "./jsx";
import { stateAt } from "./testing";

const page = `function Example() {
  return (
    <Box gap="2x">
      <Button variant="primary" disabled onClick={() => go()}>Save</Button>
      <ActionMenu.Item selected />
    </Box>
  );
}`;
const at = (needle: string, offset = 0) => page.indexOf(needle) + offset;
const where = (pos: number) => stateAt(`${page.slice(0, pos)}|${page.slice(pos)}`);

describe("elementAt", () => {
  it("names the element the cursor is in, by the tag as it is written", () => {
    expect(elementAt(where(at("Button variant", 3)).state, at("Button variant", 3))?.tag).toBe("Button");
    expect(elementAt(where(at("Save", 2)).state, at("Save", 2))?.tag).toBe("Button");
  });

  it("finds the nearest element: the one inside, not the one around", () => {
    const pos = at("variant", 2);
    expect(elementAt(where(pos).state, pos)?.tag).toBe("Button");
    const between = at("Box gap", 1);
    expect(elementAt(where(between).state, between)?.tag).toBe("Box");
  });

  it("reads a member tag whole, and a self-closing element", () => {
    const pos = at("selected", 2);
    const found = elementAt(where(pos).state, pos);
    expect(found?.tag).toBe("ActionMenu.Item");
    expect(page.slice(found!.from, found!.to)).toBe("<ActionMenu.Item selected />");
  });

  it("says where the element and its opening tag are", () => {
    const pos = at("Save", 1);
    const found = elementAt(where(pos).state, pos)!;
    expect(page.slice(found.from, found.to)).toMatch(/^<Button[\s\S]*<\/Button>$/);
    expect(page.slice(found.openFrom, found.openTo)).toMatch(/^<Button variant="primary" disabled onClick=\{\(\) => go\(\)\}>$/);
  });

  it("finds none in code that is not JSX", () => {
    expect(elementAt(where(at("Example")).state, at("Example"))).toBeNull();
  });
});

describe("openTagAt", () => {
  it("finds the tag whose attributes the cursor is in, and the attribute", () => {
    const pos = at("primary", 2);
    const { state } = where(pos);
    const open = openTagAt(state, pos)!;
    expect(tagName(state, open.tag)).toBe("Button");
    expect(state.sliceDoc(open.attribute!.from, open.attribute!.to)).toBe('variant="primary"');
    expect(open.inValue).toBe(true);
  });

  it("is not in an attribute's value on the attribute's name", () => {
    const pos = at("variant", 3);
    expect(openTagAt(where(pos).state, pos)?.inValue).toBe(false);
  });

  it("counts the spot right after the tag's name as in the tag only when asked, since that is where the next prop goes", () => {
    const end = at("Button variant", "Button".length);
    expect(openTagAt(where(end).state, end)).toBeNull();
    expect(openTagAt(where(end).state, end, true)).not.toBeNull();
    const inside = at("Button variant", 3);
    expect(openTagAt(where(inside).state, inside, true)).toBeNull();
  });

  it("is not in the opening tag from the tag's name, or from the element's text", () => {
    const name = at("Button variant", 3);
    expect(openTagAt(where(name).state, name)).toBeNull();
    const text = at("Save", 2);
    expect(openTagAt(where(text).state, text)).toBeNull();
  });

  it("finds the tag while it is still being typed, before it is closed", () => {
    const { state, pos } = stateAt("function A() { return <Button va| }");
    const open = openTagAt(state, pos);
    expect(open && tagName(state, open.tag)).toBe("Button");
  });
});

describe("attributesOf", () => {
  it("lists what is already written, leaving out the one being typed", () => {
    const { state, pos } = where(at("disabled", 3));
    const open = openTagAt(state, pos)!;
    expect(attributesOf(state, open.tag)).toEqual(["variant", "disabled", "onClick"]);
    expect(attributesOf(state, open.tag, open.attribute)).toEqual(["variant", "onClick"]);
  });
});
