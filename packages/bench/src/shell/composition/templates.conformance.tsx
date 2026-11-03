import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { checkComposition } from "../../engine/content/check";
import { printExample } from "../../engine/print";
import { toElement } from "../../engine/render";
import type { Node } from "../../engine/types";
import { runAxe } from "../../engine/wcag/axe";
import { exported, models } from "../playground/compose";
import { importFrom, resolve } from "../playground/host";
import { TEMPLATES } from "./templates";

afterEach(cleanup);

const tagsIn = (node: Node | string): string[] => (typeof node === "string" ? [] : [node.tag, ...(node.children ?? []).flatMap(tagsIn), ...Object.values(node.props ?? {}).flatMap((v) => (Array.isArray(v) ? v : [v]).flatMap((x) => (typeof x === "object" ? tagsIn(x as Node) : [])))]);

describe.each(TEMPLATES)("the $id template", (template) => {
  it("is JSON: it survives being written out and read back", () => {
    expect(JSON.parse(JSON.stringify(template.root))).toEqual(template.root);
  });

  it("is made only of components the library has", () => {
    const missing = [...new Set(tagsIn(template.root))].filter((tag) => /^[A-Z]/.test(tag) && !resolve(tag));
    expect(missing).toEqual([]);
  });

  it("is valid HTML: every piece goes where the content model says it can", () => {
    expect(checkComposition(template.root, { models, exported }).map((issue) => issue.message)).toEqual([]);
  });

  it("can be printed as code, so the code and the drawing are one thing", () => {
    expect(printExample(template.root, { importFrom }).code).toContain(`<${template.root.tag}`);
  });

  it("has no WCAG error or warning from axe (contrast is the browser's to judge)", async () => {
    const { container } = render(<div>{toElement(template.root, resolve, new Map())}</div>);
    const issues = await runAxe(container, [template.root.tag], { contrast: false });
    expect(issues.filter((i) => i.severity !== "info").map((i) => `${i.rule}: ${i.message}`)).toEqual([]);
  });
});

it("the form shows text, every kind of input, a banner and the actions", () => {
  const tags = new Set(tagsIn(TEMPLATES.find((t) => t.id === "form")!.root));
  for (const tag of ["Heading", "Text", "Callout", "InputText", "TextArea", "Select", "Autocomplete", "Switch", "Button"]) expect(tags.has(tag)).toBe(true);
});
