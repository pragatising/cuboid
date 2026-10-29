// @vitest-environment node
import { describe, expect, it } from "vitest";
import { criterionId, readTags, severityOf } from "./criteria";
import { fromAxe } from "./fromAxe";

describe("what a rule's tags say about WCAG", () => {
  it("reads a criterion's number from its digits", () => {
    expect(criterionId("143")).toBe("1.4.3");
    expect(criterionId("1410")).toBe("1.4.10");
    expect(criterionId("2411")).toBe("2.4.11");
  });

  it("reads the criteria, the version and the level", () => {
    expect(readTags(["cat.color", "wcag2aa", "wcag143", "EN-9.1.4.3"])).toEqual({ criteria: ["1.4.3"], version: "2.0", level: "AA" });
    expect(readTags(["wcag22aa", "wcag258"])).toEqual({ criteria: ["2.5.8"], version: "2.2", level: "AA" });
    expect(readTags(["cat.name-role-value", "wcag2a", "wcag412"])).toMatchObject({ criteria: ["4.1.2"], level: "A" });
  });

  it("holds a rule with several levels to the highest", () => {
    expect(readTags(["wcag2a", "wcag21aa"]).level).toBe("AA");
  });

  it("calls a rule with no level best practice", () => {
    expect(readTags(["cat.keyboard", "best-practice"])).toEqual({ criteria: [], version: undefined, level: "best-practice" });
  });

  it("makes A and AA errors, best practice a warning, AAA and what needs a person an info", () => {
    expect(severityOf("A")).toBe("error");
    expect(severityOf("AA")).toBe("error");
    expect(severityOf("best-practice")).toBe("warning");
    expect(severityOf("AAA")).toBe("info");
    expect(severityOf("AA", false)).toBe("info");
  });
});

describe("axe's results as issues", () => {
  const rule = { id: "button-name", help: "Buttons must have discernible text", helpUrl: "https://dequeuniversity.com/rules/axe/4.14/button-name", tags: ["cat.name-role-value", "wcag2a", "wcag412"] };
  const node = { target: ["button"], html: "<button></button>", failureSummary: "Fix any of the following:\n  Element does not have inner text that is visible to screen readers\n  aria-label attribute does not exist" };

  it("makes a violation an error that names its criterion, its level and axe's page", () => {
    const [issue] = fromAxe({ violations: [{ ...rule, nodes: [node] }] }, ["IconButton"]);
    expect(issue).toMatchObject({ rule: "wcag.button-name", severity: "error", source: "wcag", path: ["IconButton", "button"] });
    expect(issue.message).toBe("Buttons must have discernible text: Element does not have inner text that is visible to screen readers (button)");
    expect(issue.references).toEqual([
      { name: "WCAG 2.0 A: 4.1.2", criterion: "4.1.2" },
      { name: "axe: button-name", url: rule.helpUrl },
    ]);
  });

  it("makes what axe could not decide an info that a person has to check", () => {
    const [issue] = fromAxe({ violations: [], incomplete: [{ ...rule, tags: ["wcag2aa", "wcag143"], nodes: [node] }] }, ["Text"]);
    expect(issue.severity).toBe("info");
    expect(issue.message).toMatch(/^Needs a person to check: /);
  });

  it("makes an issue of each element a rule fails on", () => {
    expect(fromAxe({ violations: [{ ...rule, nodes: [node, { ...node, target: ["div", "button"] }] }] }, ["Box"]).map((i) => i.path[i.path.length - 1])).toEqual(["button", "div button"]);
  });

  it("calls best practice what it is, not a criterion", () => {
    const [issue] = fromAxe({ violations: [{ id: "tabindex", help: "Elements should not have tabindex greater than zero", helpUrl: "u", tags: ["cat.keyboard", "best-practice"], nodes: [node] }] }, ["X"]);
    expect(issue.severity).toBe("warning");
    expect(issue.references[0].name).toBe("Best practice (not a WCAG criterion)");
  });
});
