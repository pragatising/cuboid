import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { drawsNothing, drawsSomething } from "./drawn";

afterEach(cleanup);
const drawn = (node: React.ReactNode) => render(<div>{node}</div>).container;

describe("whether a drawn example shows anything", () => {
  it("does not for a box with nothing in it", () => {
    expect(drawsSomething(drawn(<div style={{ padding: 8 }} />))).toBe(false);
    expect(drawsSomething(drawn(<div><span /></div>))).toBe(false);
  });

  it("does for text, an image, a line or a control", () => {
    expect(drawsSomething(drawn(<p>Hello</p>))).toBe(true);
    expect(drawsSomething(drawn(<svg />))).toBe(true);
    expect(drawsSomething(drawn(<hr />))).toBe(true);
    expect(drawsSomething(drawn(<input aria-label="x" />))).toBe(true);
  });
});

describe("a component that draws nothing when its optional props are unset", () => {
  it("is an issue that says which props, and that one should be required", () => {
    const [issue] = drawsNothing(drawn(<div />), "EmptyState", ["icon", "heading", "description"], ["EmptyState"]);
    expect(issue).toMatchObject({ rule: "system.draws-nothing", severity: "warning", source: "system", path: ["EmptyState"] });
    expect(issue.message).toContain("none of icon, heading or description");
    expect(issue.message).toContain("require at least one");
  });

  it("is not one when it draws something, or when its content is not only optional props", () => {
    expect(drawsNothing(drawn(<p>Nothing here</p>), "EmptyState", ["heading"], ["EmptyState"])).toEqual([]);
    expect(drawsNothing(drawn(<div />), "Box", [], ["Box"])).toEqual([]);
  });
});
