import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { jsxDEV } from "./jsx-dev-runtime";
import { setPatches } from "./patches";

afterEach(() => setPatches({}));

/** An element as the compiled example makes it: the runtime is given the place it is written. */
const made = (type: string, props: Record<string, unknown>, line: number, column: number) => jsxDEV(type, props, undefined, false, { fileName: "A.tsx", lineNumber: line, columnNumber: column });

describe("the runtime an example is compiled against", () => {
  it("makes an element as React would when nothing is changed", () => {
    const element = made("button", { children: "One" }, 5, 7) as React.ReactElement<{ children: string }>;
    expect(element.type).toBe("button");
    expect(element.props.children).toBe("One");
  });

  it("makes the element at a changed place with the changed props, and the others as they were written", () => {
    setPatches({ "6:7": { disabled: true } });
    const first = made("button", { children: "One" }, 5, 7) as React.ReactElement<Record<string, unknown>>;
    const second = made("button", { children: "Two" }, 6, 7) as React.ReactElement<Record<string, unknown>>;
    const third = made("button", { children: "Three" }, 7, 7) as React.ReactElement<Record<string, unknown>>;
    expect(first.props.disabled).toBeUndefined();
    expect(second.props.disabled).toBe(true);
    expect(third.props.disabled).toBeUndefined();
  });

  it("takes a prop off the element it was written on when it is changed to nothing, and draws what is made", () => {
    setPatches({ "5:7": { title: undefined } });
    render(made("button", { title: "Hint", children: "One" }, 5, 7) as React.ReactElement);
    expect(screen.getByRole("button", { name: "One" })).not.toHaveAttribute("title");
  });

  it("changes nothing at a place that is not in the example, or when the place is not given", () => {
    setPatches({ "9:9": { disabled: true } });
    expect((made("button", {}, 5, 7) as React.ReactElement<Record<string, unknown>>).props.disabled).toBeUndefined();
    expect((jsxDEV("button", {}, undefined, false, undefined) as React.ReactElement<Record<string, unknown>>).props.disabled).toBeUndefined();
  });
});
