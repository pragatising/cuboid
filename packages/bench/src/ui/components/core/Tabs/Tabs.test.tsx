import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Tabs } from "./Tabs";

afterEach(cleanup);

function Example({ onValueChange }: { onValueChange?: (value: string) => void }) {
  const [value, setValue] = useState("code");
  return (
    <Tabs
      aria-label="Details"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    >
      <Tabs.Tab value="code">Code</Tabs.Tab>
      <Tabs.Tab value="tokens">Tokens</Tabs.Tab>
      <Tabs.Tab value="usage">Usage</Tabs.Tab>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("is a tablist of tabs, the open one selected", () => {
    render(<Example />);
    expect(screen.getByRole("tablist", { name: "Details" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((tab) => [tab.textContent, tab.getAttribute("aria-selected")])).toEqual([
      ["Code", "true"],
      ["Tokens", "false"],
      ["Usage", "false"],
    ]);
  });

  it("opens the tab that is pressed, and says so", () => {
    const seen: string[] = [];
    render(<Example onValueChange={(value) => seen.push(value)} />);
    fireEvent.click(screen.getByRole("tab", { name: "Tokens" }));
    expect(screen.getByRole("tab", { name: "Tokens" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Code" })).toHaveAttribute("aria-selected", "false");
    expect(seen).toEqual(["tokens"]);
  });

  it("is reached by Tab at the open one only, and the arrow keys move between them", async () => {
    render(<Example />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
    tabs[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(tabs[2]).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tabs[0]).toHaveFocus();
  });

  it("is not a segmented control: it has no strip, and takes its colours from the tablist tokens", () => {
    const css = require("node:fs").readFileSync("src/ui/components/core/Tabs/Tabs.module.css", "utf8") as string;
    expect(css).toContain("--cube-tablist-primary-button-bgColor-rest");
    expect(css).not.toContain("segmentedControl");
    expect(css.match(/var\(--cube-[a-zA-Z-]+\)/g)?.every((v) => /--cube-(tablist|text-size|focusRing)/.test(v))).toBe(true);
  });
});
