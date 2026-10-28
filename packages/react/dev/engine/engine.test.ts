import ts from "typescript";
import { describe, expect, it } from "vitest";
import components from "../generated/components.json";
import { cover } from "./cover";
import { allowedBy, domainsOf, parseDefault } from "./domains";
import { buildNode, printExample } from "./print";
import type { ComponentDoc, Fixtures, Node } from "./types";

const fixtures: Fixtures = {
  labels: { short: "Save changes", long: "Save all changes and continue to the next step" },
  fillers: {
    leadingVisual: { tag: "Icon", props: { name: "add" } },
    trailingVisual: { tag: "Icon", props: { name: "arrow_forward" } },
  },
};
const button = (components as unknown as Record<string, ComponentDoc>).Button;
const { domains } = domainsOf(button, fixtures);

const requirementsOf = (strength: 1 | 2) => {
  const required = domains.map((d) => d.choices.filter((c) => c.required));
  const keys = required.flat().map((c) => c.id);
  if (strength === 2)
    for (let i = 0; i < domains.length; i++)
      for (let j = i + 1; j < domains.length; j++) for (const a of required[i]) for (const b of required[j]) keys.push(`${a.id}&${b.id}`);
  return keys;
};
const shownBy = (rows: ReturnType<typeof cover>["rows"], strength: 1 | 2) => {
  const shown = new Set<string>();
  for (const row of rows) {
    const chosen = domains.map((d) => row.picks[d.prop]).filter((c) => c.required);
    chosen.forEach((c) => shown.add(c.id));
    if (strength === 2) for (let i = 0; i < chosen.length; i++) for (let j = i + 1; j < chosen.length; j++) shown.add(`${chosen[i].id}&${chosen[j].id}`);
  }
  return shown;
};

describe("domains", () => {
  it("reads a default from its source text", () => {
    expect(parseDefault('"center"')).toBe("center");
    expect(parseDefault("true")).toBe(true);
    expect(parseDefault("someFunction()")).toBeUndefined();
    expect(parseDefault(undefined)).toBeUndefined();
  });

  it("makes a slot two choices, not one per thing that could fill it", () => {
    const leading = domains.find((d) => d.prop === "leadingVisual");
    expect(leading?.choices.map((c) => c.id)).toEqual(["leadingVisual=empty", "leadingVisual=filled"]);
  });

  it("leaves the default off, so the baseline example says nothing it does not have to", () => {
    const variant = domains.find((d) => d.prop === "variant");
    const baseline = variant?.choices.find((c) => c.baseline);
    expect(baseline?.id).toBe("variant=secondary");
    expect(baseline?.value).toBeUndefined();
  });

  it("lists what it cannot vary instead of dropping it", () => {
    const { skipped } = domainsOf(button, fixtures);
    expect(skipped.map((s) => s.prop)).toContain("loadingMessage");
  });

  it("fills a slot nothing was said about with text named after it, not with a picture", () => {
    const doc: ComponentDoc = { name: "X", props: [{ name: "descriptionVisual", kind: "slot" }, { name: "label", kind: "slot", required: true }] };
    const { domains, blocked } = domainsOf(doc, { ...fixtures, fillers: {} });
    expect(blocked).toEqual([]);
    expect(domains.map((d) => d.choices[d.choices.length - 1].value)).toEqual(["Description visual", "Label"]);
  });
});

describe.each([1, 2] as const)("cover, strength %i", (strength) => {
  const { rows, uncovered } = cover(domains, { strength });

  it("shows everything it was asked to", () => {
    expect(uncovered).toEqual([]);
    const shown = shownBy(rows, strength);
    expect(requirementsOf(strength).filter((key) => !shown.has(key))).toEqual([]);
  });

  it("starts with the baseline, which says nothing", () => {
    expect(rows[0].title).toBe("Default");
  });

  it("has no example that shows nothing the others do not", () => {
    for (let i = 1; i < rows.length; i++) {
      const others = shownBy(rows.filter((_, j) => j !== i), strength);
      const mine = shownBy([rows[i]], strength);
      expect([...mine].some((key) => !others.has(key))).toBe(true);
    }
  });

  it("is the same every time", () => {
    expect(cover(domains, { strength }).rows.map((r) => r.title)).toEqual(rows.map((r) => r.title));
  });
});

describe("how many examples", () => {
  it("shows every value of Button in as many examples as its largest set of values", () => {
    // variant has five values; everything else fits alongside them.
    expect(cover(domains, { strength: 1 }).rows).toHaveLength(5);
  });

  it("shows every pair in far fewer than all the combinations", () => {
    const all = domains.reduce((n, d) => n * d.choices.length, 1);
    const pairs = cover(domains, { strength: 2 }).rows.length;
    expect(pairs).toBeLessThan(25);
    expect(all).toBeGreaterThan(pairs * 100);
  });

  it("asks for no pairs when no props interact, and only the interacting ones otherwise", () => {
    expect(cover(domains, { strength: 2, interacts: () => false }).rows).toHaveLength(cover(domains, { strength: 1 }).rows.length);
    // Pairs of flags are not asked for, so the flags can share examples: never more than showing every pair.
    const interacts = (a: string, b: string) => !(["disabled", "block", "loading", "inactive"].includes(a) && ["disabled", "block", "loading", "inactive"].includes(b));
    expect(cover(domains, { strength: 2, interacts }).rows.length).toBeLessThanOrEqual(cover(domains, { strength: 2 }).rows.length);
  });

  it("leaves a requirement it cannot show as a gap, and stops", () => {
    const valid = (picks: Record<string, { id: string }>) => !(picks.loading?.id === "loading=on" && picks.disabled?.id === "disabled=on");
    const result = cover(domains, { strength: 2, valid: valid as never });
    expect(result.uncovered).toContain("disabled=on&loading=on");
  });
});

describe("exclusive flags", () => {
  const exclusive = [["disabled", "loading", "inactive"]];
  const { rows, uncovered } = cover(domains, { strength: 2, valid: allowedBy(exclusive) });

  it("never turns on two flags of a group in one example", () => {
    for (const row of rows) expect(["disabled", "loading", "inactive"].filter((p) => row.picks[p]?.value === true).length).toBeLessThanOrEqual(1);
  });

  it("lists the pairs it therefore never shows, instead of hiding them", () => {
    expect(uncovered).toEqual(expect.arrayContaining(["disabled=on&loading=on", "disabled=on&inactive=on", "loading=on&inactive=on"]));
  });
});

describe("print", () => {
  const { rows } = cover(domains, { strength: 1 });
  const printed = rows.map((row) => printExample(buildNode(button, row.picks), { importFrom: "@sragatiping/cuboid" }));

  it("prints a function that is valid TSX", () => {
    for (const { code } of printed) {
      const result = ts.transpileModule(code, { reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX } });
      expect(result.diagnostics?.map((d) => d.messageText)).toEqual([]);
    }
  });

  it("imports what the example uses and nothing else", () => {
    expect(printed[0].code.split("\n")[0]).toBe('import { Button } from "@sragatiping/cuboid";');
    expect(printed.some((p) => p.code.split("\n")[0] === 'import { Button, Icon } from "@sragatiping/cuboid";')).toBe(true);
  });

  it("says where each element was written, in the lines of the function", () => {
    for (const { code, lineMap, sources } of printed) {
      const lines = code.split("\n");
      for (const [, source] of sources) {
        const [open] = source.split(";");
        const [from, to] = open.split("-").map((p) => p.split(":").map(Number));
        const row = (n: number) => lines[lineMap.indexOf(n)];
        const text = from[0] === to[0] ? row(from[0]).slice(from[1], to[1]) : row(from[0]).slice(from[1]);
        expect(text.startsWith("<")).toBe(true);
        if (from[0] === to[0]) expect(text.endsWith(">")).toBe(true);
      }
    }
  });

  it("marks the opening and closing tag of an element that has children", () => {
    const node: Node = { tag: "Button", props: { variant: "primary" }, children: ["Go"] };
    const { sources } = printExample(node, { importFrom: "x" });
    expect(sources.get(node)).toMatch(/^\d+:\d+-\d+:\d+;\d+:\d+-\d+:\d+$/);
  });

  it("puts an attribute on each line when the tag is too long for one", () => {
    const node: Node = {
      tag: "Button",
      props: { variant: "primary", size: "lg", alignContent: "start", leadingVisual: { tag: "Icon", props: { name: "add" } }, trailingVisual: { tag: "Icon", props: { name: "arrow_forward" } } },
      children: [fixtures.labels.long],
    };
    const { code } = printExample(node, { importFrom: "x" });
    expect(code).toContain('\n      variant="primary"\n');
    expect(Math.max(...code.split("\n").map((l) => l.length))).toBeLessThanOrEqual(80);
  });
});
