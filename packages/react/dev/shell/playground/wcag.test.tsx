import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InputText } from "../../../src";
import modelsJson from "../../generated/models.json";
import { cover } from "../../engine/cover";
import { allowedBy, domainsOf } from "../../engine/domains";
import type { Issue } from "../../engine/content/issue";
import { buildNode, printExample } from "../../engine/print";
import { toElement } from "../../engine/render";
import { recognise } from "../../engine/recognise/recognise";
import type { Models } from "../../engine/recognise/recognise";
import { drawsNothing } from "../../engine/content/drawn";
import { composeExamples } from "./compose";
import { runAxe } from "../../engine/wcag/axe";
import { fixtures, resolve } from "./host";

const { exports: exported, models } = modelsJson as unknown as { exports: Record<string, string>; models: Models };

afterEach(cleanup);

/** Every example the engine composes for a component, rendered, and what axe finds in each. */
async function findings(name: string): Promise<Issue[]> {
  const { doc, conditions, scenarios } = recognise(models[exported[name]], models, exported);
  const { domains, blocked } = domainsOf(doc, fixtures);
  if (!domains.length || blocked.length) return [];
  const { rows } = cover(domains, { strength: 1, valid: allowedBy([[...conditions, ...scenarios], ...(fixtures.exclusive ?? [])]) });
  const out: Issue[] = [];
  for (const row of rows) {
    const node = buildNode(doc, row.picks);
    const { sources } = printExample(node, { importFrom: "x" });
    const { container } = render(<div>{toElement(node, resolve, sources)}</div>);
    // Contrast needs a browser's layout and paint; jsdom has neither, so it is the shell's to run, not this test's.
    out.push(...(await runAxe(container, [name], { contrast: false })));
    cleanup();
  }
  return out;
}

describe("WCAG, by axe, over what the engine composes", () => {
  it("would notice a field with no label (so a clean result is a result)", async () => {
    const { container } = render(<InputText />);
    const issues = await runAxe(container, ["InputText"], { contrast: false });
    expect(issues).toContainEqual(expect.objectContaining({ rule: "wcag.label", severity: "error", source: "wcag" }));
    expect(issues.find((i) => i.rule === "wcag.label")?.references).toContainEqual(expect.objectContaining({ criterion: "4.1.2" }));
  });

  it("gives a control the name it must have: a slot that lands in a label is always filled, an icon-only button carries its aria-label", () => {
    const label = (name: string) => recognise(models[exported[name]], models, exported).doc.props.find((p) => p.name === "label");
    for (const name of ["InputText", "Select", "TextArea", "Switch", "Autocomplete"]) expect(label(name)).toMatchObject({ names: true });
    expect(fixtures.attributes?.IconButton).toEqual({ "aria-label": "Add" });
  });

  it("finds that no component draws nothing when its optional props are unset", () => {
    const flagged: string[] = [];
    for (const name of Object.keys(exported)) {
      const composed = composeExamples(name);
      const first = composed?.rows[0];
      if (!composed || !first) continue;
      const { container } = render(<div>{toElement(first.node, resolve, first.printed.sources)}</div>);
      if (drawsNothing(container, name, composed.contentFromOptional, [name]).length) flagged.push(name);
      cleanup();
    }
    expect(flagged).toEqual([]);
  });

  it("finds no error or warning in any example of any component", async () => {
    const all: Record<string, Issue[]> = {};
    for (const name of Object.keys(exported)) {
      const found = await findings(name);
      if (found.length) all[name] = found;
    }
    const worse = Object.entries(all).flatMap(([name, issues]) => issues.filter((i) => i.severity !== "info").map((i) => `${name}: ${i.rule}: ${i.message}`));
    expect(worse).toEqual([]);

    // What is left is what axe says a person has to check (WCAG 2.5.3, the visible text is part of the name). An icon-only button named
    // "Add" draws an icon whose font ligature is the text "add", and axe cannot tell a glyph from a word; a Tooltip named for what its
    // trigger does is not the trigger's own text, so axe asks whether that is intended.
    const infos = [...new Set(Object.entries(all).flatMap(([name, issues]) => issues.map((i) => `${name}: ${i.rule}`)))].sort();
    expect(infos).toEqual(["IconButton: wcag.label-content-name-mismatch", "Sidebar: wcag.label-content-name-mismatch", "Tooltip: wcag.label-content-name-mismatch"]);
  }, 300_000);
});
