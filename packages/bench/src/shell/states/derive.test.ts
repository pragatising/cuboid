import { afterEach, describe, expect, it } from "vitest";
import { discoverParts, modelFromFound, selectorSignals } from "./derive";

describe("selectorSignals", () => {
  it("reads forced interactions as the dev rewrite spells them", () => {
    const signals = selectorSignals(':where(.B:is(:hover, [data-force~="hover"]):not(:disabled))');
    expect(signals.map((s) => s.interaction)).toEqual(["hover"]);
  });

  it("reads an attribute that records a state, and names the state for it", () => {
    const signals = selectorSignals('.T[aria-expanded="true"], .T[data-open]');
    expect(signals.map((s) => [s.interaction, s.id])).toEqual([["toggle", "expanded"], ["toggle", "open"]]);
  });

  it("ignores attributes that are not states, and the false value of one", () => {
    expect(selectorSignals('.B[data-variant="primary"], .B[data-size="sm"], .B[data-loading], .T[aria-expanded="false"]')).toEqual([]);
  });

  it("reads a placeholder rule as the empty field, whose other side is filled", () => {
    expect(selectorSignals(".I::placeholder").map((s) => [s.interaction, s.id])).toEqual([["edit", "filled"]]);
  });

  it("does not read data-placeholder as typing: on a Select it only says nothing is chosen", () => {
    expect(selectorSignals(".C[data-placeholder]")).toEqual([]);
  });
});

describe("discoverParts", () => {
  const style = document.createElement("style");
  afterEach(() => {
    style.remove();
    document.body.innerHTML = "";
  });

  function page(css: string, html: string) {
    style.textContent = css;
    document.head.append(style);
    document.body.innerHTML = `<div id="host">${html}</div>`;
    return document.getElementById("host")!;
  }

  it("finds the element a person acts on, and names the part by its data-component", () => {
    const host = page(
      '.Item:is(:hover, [data-force~="hover"]) .Label { color: red } .Menu { display: block }',
      '<div class="Menu" data-component="Menu"><div class="Item" data-component="Menu.Item"><span class="Label">x</span></div></div>',
    );
    const parts = discoverParts(host, "Menu");
    expect(parts.map((p) => p.part)).toEqual(["Menu", "Menu.Item"]);
    const item = parts[1].model;
    expect(item.states.map((s) => s.id)).toEqual(["rest", "hover"]);
    // The item is the third element in the host: Menu, Item, Label.
    expect(item.interactions[0]).toMatchObject({ id: "hover", from: "rest", to: "hover", target: 1 });
  });

  it("gives a focusable part hover, press and focus even when no rule styles them", () => {
    const host = page(".L { color: blue }", '<a class="L" data-component="Link" href="#x">a</a>');
    const [part] = discoverParts(host, "Link");
    expect(part.model.interactions.map((i) => `${i.id}:${i.from}>${i.to}`)).toEqual(["hover:rest>hover", "press:hover>press", "focus:rest>focus"]);
  });

  it("does not give a disabled control or a plain box interactions it was not styled for", () => {
    const host = page(".B { color: blue }", '<button class="B" data-component="Button" disabled></button><div class="B" data-component="Box"></div>');
    expect(discoverParts(host, "Box").flatMap((p) => p.model.interactions)).toEqual([]);
  });

  it("gives a part that reacts to nothing its rest alone", () => {
    const host = page(".Box { display: block }", '<div class="Box" data-component="Box"></div>');
    const [only] = discoverParts(host, "Box");
    expect(only.model.states.map((s) => s.id)).toEqual(["rest"]);
    expect(only.model.interactions).toEqual([]);
  });

  it("finds a state an attribute records, on the element that carries it", () => {
    const host = page('.T[aria-expanded="true"] { background: red }', '<button class="T" data-component="T" aria-expanded="false"></button>');
    const [part] = discoverParts(host, "T");
    // A button can also be hovered, pressed and focused, whatever the stylesheet says.
    expect(part.model.states.map((s) => s.id)).toEqual(["rest", "hover", "press", "expanded", "focus"]);
    expect(part.model.interactions.find((i) => i.to === "expanded")).toMatchObject({ id: "toggle", from: "rest" });
  });
});

describe("modelFromFound", () => {
  const found = (id: string, interaction: "hover" | "press" | "focus", target = 0) => ({
    part: "P",
    signal: { interaction, id, label: id, probe: () => null },
    step: { target, action: { kind: "force" as const, token: interaction } },
  });

  it("chains press after hover, and reaches focus from rest", () => {
    const m = modelFromFound([found("hover", "hover"), found("press", "press"), found("focus", "focus")]);
    expect(m.interactions.map((i) => `${i.id}:${i.from}>${i.to}`)).toEqual(["hover:rest>hover", "press:hover>press", "focus:rest>focus"]);
    expect(m.states.find((s) => s.id === "press")?.apply.map((s) => s.action)).toEqual([{ kind: "force", token: "hover" }, { kind: "force", token: "press" }]);
  });

  it("presses from rest when there is no hover", () => {
    expect(modelFromFound([found("press", "press")]).interactions[0]).toMatchObject({ from: "rest", to: "press" });
  });
});
