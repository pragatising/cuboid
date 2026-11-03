import path from "node:path";
import { describe, expect, it } from "vitest";
import { readLibrary } from "./readLibrary.mjs";

const libraries = path.resolve(__dirname, "../../test/libraries");
const read = (name: string) => {
  const root = path.join(libraries, name);
  return readLibrary({ entries: [path.join(root, "src/index.ts")], root, packageRoots: [root] });
};
const names = (entry: { props: { name: string }[] }) => entry.props.map((prop) => prop.name);

describe("a library read from its code, whatever it is called and however it is laid out", () => {
  describe("plain: function components, a folder of files, parts by Object.assign", () => {
    const { components } = read("plain");

    it("finds the components by what the entry exports", () => {
      expect(Object.keys(components).sort()).toEqual(["Banner", "Card", "Menu", "Overlay"]);
    });

    it("lists every member of the props type, in order, wherever it is declared", () => {
      expect(names(components.Card)).toEqual(["title", "tone"]);
      // `Omit<OverlayProps, "autoFocus"> & { dense }`: the other component's props are this one's props.
      expect(names(components.Menu)).toEqual(["trigger", "open", "onOpenChange", "placement", "children", "dense"]);
    });

    it("counts what the platform adds and does not list it", () => {
      expect(components.Card.native.dom).toBeGreaterThan(200);
      expect(components.Card.props.some((prop: { name: string }) => prop.name === "className")).toBe(false);
      expect(components.Overlay.native).toEqual({ dom: 0, css: 0 });
    });

    it("reads the parts a component has, by the properties of its type", () => {
      expect(components.Menu.parts.map((part: { name: string }) => part.name)).toEqual(["Menu.Item"]);
      expect(names(components.Menu.parts[0])).toEqual(["selected"]);
    });

    it("reads the default the types and the docs give", () => {
      const placement = components.Menu.props.find((prop: { name: string }) => prop.name === "placement");
      expect(placement).toMatchObject({ kind: "enum", values: ["top", "bottom"], default: '"bottom"' });
    });

    it("keeps where each prop is declared, as a path from the library's root", () => {
      expect(components.Menu.props.find((prop: { name: string }) => prop.name === "dense").source).toBe("src/Menu.tsx");
      expect(components.Menu.props.find((prop: { name: string }) => prop.name === "trigger").source).toBe("src/Overlay.tsx");
    });
  });

  describe("odd: one file, a class, interfaces and generics, parts by assignment, a wrapped component", () => {
    const { components } = read("odd");

    it("finds a class, a function, and a component made by a function from another", () => {
      expect(Object.keys(components).sort()).toEqual(["Badge", "Panel", "TonedPanel"]);
    });

    it("reads a class component's props from its type argument, with what its interface extends after its own", () => {
      expect(names(components.Badge)).toEqual(["count", "shade", "label"]);
      expect(components.Badge.props.find((prop: { name: string }) => prop.name === "shade").default).toBe('"gray"');
    });

    it("reads the parts assigned to a function after it is declared", () => {
      expect(components.Panel.parts.map((part: { name: string }) => part.name)).toEqual(["Panel.Row"]);
      expect(names(components.Panel.parts[0])).toEqual(["value", "onPick", "label"]);
    });

    it("lists the props of a component the code does not define in a body, from its type", () => {
      expect(names(components.TonedPanel)).toEqual(["heading", "tone"]);
    });
  });
});
