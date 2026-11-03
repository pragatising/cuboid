import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { printExample } from "../../engine/print";
import { anatomyExample, composeExamples, exported } from "../../shell/playground/compose";
import { importFrom } from "../../shell/playground/host";
import { draw } from "./draw";

afterEach(cleanup);

// No boundary here, on purpose: a component that cannot be drawn from what the engine composed (a state update that never settles, a prop it cannot
// draw) fails the test, where on the page it would be caught and shown. Pill once looped until React gave up.
describe("the page in a frame draws the example of every component", () => {
  it.each(Object.keys(exported))("%s without throwing", (name) => {
    const example = anatomyExample(composeExamples(name));
    if (!example) return;
    const printed = printExample(example.node, { importFrom });
    expect(() => render(<>{draw({ node: example.node, sources: printed.sources })}</>)).not.toThrow();
  });
});
