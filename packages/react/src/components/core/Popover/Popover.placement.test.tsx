import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "../Button";
import { Popover } from "./Popover";

// jsdom has no layout, so the rectangles are given: the trigger where the test says, the panel 280 x 200, in a window 1024 x 768.
let trigger = { left: 0, top: 0, width: 80, height: 32 };
beforeEach(() => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const box = this.getAttribute("data-component") === "Popover" ? { left: 0, top: 0, width: 280, height: 200 } : trigger;
    return { ...box, right: box.left + box.width, bottom: box.top + box.height, x: box.left, y: box.top, toJSON: () => ({}) } as DOMRect;
  });
});
afterEach(() => vi.restoreAllMocks());

const open = async () => {
  render(
    <Popover trigger={<Button>Open</Button>} role="dialog" aria-label="Panel">
      <p>Content</p>
    </Popover>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  return screen.findByRole("dialog", { name: "Panel" });
};

describe("a popover near the edge of the window", () => {
  it("is where it was asked for when there is room", async () => {
    trigger = { left: 100, top: 100, width: 80, height: 32 };
    const panel = await open();
    expect(panel.style.left).toBe("100px");
    expect(panel.getAttribute("data-placement")).toBe("bottom-start");
  });

  it("slides left to stay inside the window at the right edge", async () => {
    trigger = { left: 960, top: 100, width: 60, height: 32 };
    const panel = await open();
    expect(panel.style.left).toBe(`${1024 - 280 - 8}px`);
  });

  it("flips above its trigger near the bottom edge, and says so", async () => {
    trigger = { left: 100, top: 700, width: 80, height: 32 };
    const panel = await open();
    expect(panel.getAttribute("data-placement")).toBe("top-start");
    expect(panel.style.top).toBe(`${700 - 4 - 200}px`);
  });

  it("is shortened to the room it has, and scrolls inside it", async () => {
    // A panel 200 tall, a trigger that leaves 172px over it and 180px under it in a window 768 tall: it stays under, and takes what is there.
    trigger = { left: 100, top: 180, width: 80, height: 400 };
    const panel = await open();
    expect(panel.getAttribute("data-placement")).toBe("bottom-start");
    expect(panel.style.maxHeight).toBe(`${180 - 4}px`);
  });
});
