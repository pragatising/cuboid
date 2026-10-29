import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../Button";
import { Tooltip } from "./Tooltip";

// jsdom has no layout: the trigger is where the test says, the tooltip 160 x 28, in a window 1024 x 768.
let trigger = { left: 0, top: 0, width: 60, height: 24 };
beforeEach(() => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const box = this.getAttribute("data-component") === "Tooltip" ? { left: 0, top: 0, width: 160, height: 28 } : trigger;
    return { ...box, right: box.left + box.width, bottom: box.top + box.height, x: box.left, y: box.top, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => vi.restoreAllMocks());

const show = async (placement: React.ComponentProps<typeof Tooltip>["placement"] = "bottom") => {
  render(
    <Tooltip text="Save" placement={placement}>
      <Button>Go</Button>
    </Tooltip>,
  );
  await userEvent.tab();
  return document.querySelector('[data-component="Tooltip"]') as HTMLElement;
};

describe("a tooltip near the edge of the window", () => {
  it("is centred under its trigger when there is room", async () => {
    trigger = { left: 400, top: 100, width: 60, height: 24 };
    const tip = await show();
    expect(tip.style.left).toBe(`${400 + 30 - 80}px`);
    expect(tip.getAttribute("data-placement")).toBe("bottom");
  });

  it("slides left to stay inside the window at the right edge", async () => {
    trigger = { left: 980, top: 100, width: 40, height: 24 };
    const tip = await show();
    expect(tip.style.left).toBe(`${1024 - 160 - 8}px`);
  });

  it("flips above its trigger near the bottom edge", async () => {
    trigger = { left: 400, top: 750, width: 60, height: 24 };
    const tip = await show("bottom");
    expect(tip.getAttribute("data-placement")).toBe("top");
  });
});
