import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AnatomyProvider } from "../anatomy/AnatomyContext";
import { PropsProvider } from "../props/PropsContext";
import { exported } from "./compose";
import { PlaygroundView } from "./PlaygroundView";

afterEach(cleanup);

// No error boundary here, on purpose: a component that makes the Playground throw (a state update that never settles, a prop it cannot
// draw) fails the test, where in the shell it would be caught and shown. Pill once looped until React gave up.
describe("the Playground of every component", () => {
  it.each(Object.keys(exported))("%s draws without throwing", (name) => {
    expect(() =>
      render(
        <AnatomyProvider>
          <PropsProvider>
            <PlaygroundView component={name} />
          </PropsProvider>
        </AnatomyProvider>,
      ),
    ).not.toThrow();
  });
});
