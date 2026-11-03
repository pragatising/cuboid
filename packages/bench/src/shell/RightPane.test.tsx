import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnatomyProvider } from "./anatomy/AnatomyContext";
import { PropsProvider } from "./props/PropsContext";
import { RightPane } from "./RightPane";

// The Accessibility tab runs checks in a page of its own (a build-time module); the tabs are what is tested here.
vi.mock("./issues/IssuesPanel", () => ({ IssuesPanel: () => null }));

afterEach(cleanup);

const pane = (view: string, frame?: string | null) =>
  render(
    <AnatomyProvider>
      <PropsProvider>
        <RightPane context={{ component: "Button", view }} frame={frame} />
      </PropsProvider>
    </AnatomyProvider>,
  );
const tabs = () => within(screen.getByRole("tablist", { name: "Details" })).getAllByRole("tab").map((tab) => tab.textContent);

describe("the right pane's tabs", () => {
  it("has Design, Usage and Accessibility in Anatomy", () => {
    pane("anatomy");
    expect(tabs()).toEqual(["Design", "Usage", "Accessibility"]);
  });

  it("is the component's source in the Component view: Code and Tokens (Figma 5048:119969)", () => {
    pane("component");
    expect(tabs()).toEqual(["Code", "Tokens"]);
  });

  it("says so when there is nothing written about usage", () => {
    pane("anatomy");
    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
    expect(screen.getByText(/Nothing written about how to use this yet/)).toBeTruthy();
  });

  it("is not there in Examples until a frame is selected", () => {
    const { container } = pane("examples", null);
    expect(container.firstChild).toBeNull();
  });

  it("has the one tab, Inspect, in Examples once a frame is selected", () => {
    pane("examples", "Button:Default");
    expect(tabs()).toEqual(["Inspect"]);
  });
});
