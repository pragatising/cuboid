import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AnatomyProvider } from "../anatomy/AnatomyContext";
import apiJson from "~bench/generated/api.json";
import { hasExamples } from "../../frame/examples";
import { ExamplesView } from "./ExamplesView";

const view = (component: string) => render(<AnatomyProvider><ExamplesView component={component} /></AnatomyProvider>);

afterEach(cleanup);

describe("the Examples view", () => {
  it("is a frame for each example, named for it, each drawn in a page of its own", async () => {
    view("SmartCard");
    expect(await screen.findByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Own client")).toBeInTheDocument();
    expect(screen.getByTitle("SmartCard: Sign in needed").tagName).toBe("IFRAME");
  });

  it("says how to write examples when a component has none", () => {
    // A component of the library with no examples file; none is named here, so the check does not go stale when one is written.
    const bare = Object.keys(apiJson as Record<string, unknown>).find((name) => !name.includes(".") && !hasExamples(name));
    view(bare!);
    expect(screen.getByText("No examples yet")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${bare}\\.examples\\.tsx`))).toBeInTheDocument();
  });
});
