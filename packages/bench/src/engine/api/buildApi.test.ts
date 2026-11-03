import { describe, expect, it } from "vitest";
import { apiOf } from "../../test/fixtureLibrary";

const names = (entry: { props: { info: { name: string } }[] }) => entry.props.map((prop) => prop.info.name);

describe("what a caller can set, derived from a library's code", () => {
  describe("plain", () => {
    const api = apiOf("plain");

    it("lists every prop of the props type on the component, and the parts as components of their own", () => {
      expect(Object.keys(api).sort()).toEqual(["Banner", "Card", "Menu", "Menu.Item", "Overlay"]);
      expect(api.Menu.parts).toEqual(["Menu.Item"]);
      expect(names(api["Menu.Item"])).toEqual(["selected"]);
    });

    it("puts the props a component takes for what it is built on in its own list, wherever they are declared", () => {
      // Menu is built on Overlay, and takes its props: `trigger` is set on Menu.
      expect(names(api.Menu)).toEqual(expect.arrayContaining(["dense", "trigger", "open", "placement"]));
      expect(api.Menu.builtOn?.on).toBe("Overlay");
    });

    it("puts what the component decides on what it is built on apart: it is not the caller's", () => {
      expect(api.Menu.sets).toContainEqual({ name: "autoFocus", value: "false" });
      expect(names(api.Menu)).not.toContain("autoFocus");
    });

    it("lists the props the component's own file declares first", () => {
      expect(names(api.Menu)[0]).toBe("dense");
    });

    it("gives the default the code gives: the docs, or the parameter's destructuring", () => {
      expect(api.Card.props.find((prop) => prop.info.name === "tone")?.info.default).toBe('"info"');
      expect(api.Menu.props.find((prop) => prop.info.name === "dense")?.info.default).toBe("false");
      expect(api.Menu.props.find((prop) => prop.info.name === "placement")?.info.default).toBe('"bottom"');
    });

    it("says which element it finally is", () => {
      expect(api.Card.element).toBe("section");
      expect(api.Overlay.element).toBeUndefined();
    });

    it("counts the platform's attributes and does not list them", () => {
      expect(api.Card.native.dom).toBeGreaterThan(200);
      expect(names(api.Card)).toEqual(["title", "tone"]);
    });
  });

  describe("odd", () => {
    const api = apiOf("odd");

    it("handles a class, a function with a part assigned to it, and a component made by a function", () => {
      expect(Object.keys(api).sort()).toEqual(["Badge", "Panel", "Panel.Row", "TonedPanel"]);
      expect(names(api.Badge)).toEqual(["count", "shade", "label"]);
      expect(names(api["Panel.Row"])).toEqual(["value", "onPick", "label"]);
    });

    it("has no built-on component where the code gives none", () => {
      expect(api.TonedPanel.builtOn).toBeUndefined();
      expect(api.TonedPanel.sets).toEqual([]);
    });
  });

  it("shows a default the component writes before the spread as written, or as the library's adapter says it is", () => {
    const written = apiOf("plain").Banner.props.find((prop) => prop.info.name === "tone");
    expect(written?.info.default).toBe('pick("warn")');
    const resolved = apiOf("plain", (expression) => (expression === 'pick("warn")' ? '"warn"' : undefined)).Banner.props.find((prop) => prop.info.name === "tone");
    expect(resolved?.info.default).toBe('"warn"');
  });
});
