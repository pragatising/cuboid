import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Frame } from "./Frame";
import { useScreenWidth } from "./screen";

const Probe = () => <span data-testid="seen">{String(useScreenWidth())}</span>;
const name = () => screen.getByRole("button", { name: /Frame/ });
const select = () => fireEvent.click(name());
const handle = (side: string) => screen.getByRole("separator", { name: `Resize frame: ${side}` });
const corner = (which: string) => document.querySelector(`[data-handle="${which}"]`) as HTMLElement;
const captured = (el: HTMLElement) => {
  el.setPointerCapture = () => undefined;
  el.releasePointerCapture = () => undefined;
  return el;
};

describe("a frame", () => {
  it("has the width it is given, says so, and tells what is in it", () => {
    render(
      <Frame defaultWidth={720}>
        <Probe />
      </Frame>,
    );
    expect(screen.getByText("Frame · 720 px")).toBeTruthy();
    expect(screen.getByTestId("seen").textContent).toBe("720");
  });

  it("fits its content when it is given no width, and what is in it has no screen to fill", () => {
    render(
      <Frame defaultWidth={null}>
        <Probe />
      </Frame>,
    );
    expect(screen.getByText("Frame · fits content")).toBeTruthy();
    expect(screen.getByTestId("seen").textContent).toBe("null");
  });

  it("is marked as fitting its content only while it has no width, so a width it is given is not capped", () => {
    const inner = (container: HTMLElement) => container.querySelector("[class*=Frame]:not([class*=Wrap])") as HTMLElement;
    const fits = render(<Frame defaultWidth={null}>x</Frame>);
    expect(inner(fits.container)).toHaveAttribute("data-fit");
    const given = render(<Frame defaultWidth={900}>x</Frame>);
    expect(inner(given.container)).not.toHaveAttribute("data-fit");
    // And a frame that is made wider by hand stops fitting.
    fireEvent.click(within(given.container).getByRole("button"));
    expect(inner(given.container)).not.toHaveAttribute("data-fit");
  });

  it("holds what is in it in a box that clips, so the frame never scrolls", () => {
    const { container } = render(<Frame defaultWidth={720}>x</Frame>);
    expect(container.querySelector("[class*=Clip]")).toHaveTextContent("x");
  });
});

describe("selecting a frame", () => {
  it("is selected by pressing its name, and shows eight handles: four sides and four corners", () => {
    render(<Frame defaultWidth={720}>x</Frame>);
    expect(document.querySelectorAll("[data-handle]")).toHaveLength(0);
    select();
    expect(name().getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelectorAll("[data-handle]")).toHaveLength(8);
    expect(screen.getAllByRole("separator")).toHaveLength(4);
  });

  it("lets go when its name is pressed again", () => {
    render(<Frame defaultWidth={720}>x</Frame>);
    select();
    select();
    expect(document.querySelectorAll("[data-handle]")).toHaveLength(0);
  });
});

describe("resizing a frame", () => {
  it("is made wider and narrower from the keyboard, five times as much with Shift, and stays within limits", () => {
    render(<Frame defaultWidth={720}>x</Frame>);
    select();
    fireEvent.keyDown(handle("right"), { key: "ArrowRight" });
    expect(screen.getByText("Frame · 736 px")).toBeTruthy();
    fireEvent.keyDown(handle("right"), { key: "ArrowLeft", shiftKey: true });
    expect(screen.getByText("Frame · 656 px")).toBeTruthy();
    for (let i = 0; i < 100; i++) fireEvent.keyDown(handle("right"), { key: "ArrowLeft", shiftKey: true });
    expect(screen.getByText("Frame · 240 px")).toBeTruthy();
  });

  it("is dragged by its right edge: the pointer moves it as far as it moves", () => {
    render(<Frame defaultWidth={400}>x</Frame>);
    select();
    const edge = captured(handle("right"));
    fireEvent.pointerDown(edge, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(edge, { clientX: 260, pointerId: 1 });
    expect(screen.getByText("Frame · 560 px")).toBeTruthy();
    fireEvent.pointerUp(edge, { pointerId: 1 });
    fireEvent.pointerMove(edge, { clientX: 900, pointerId: 1 });
    expect(screen.getByText("Frame · 560 px")).toBeTruthy();
  });

  it("is dragged by its left edge: the width follows and the frame moves so the right edge stays", () => {
    const { container } = render(<Frame defaultWidth={400}>x</Frame>);
    select();
    const edge = captured(handle("left"));
    fireEvent.pointerDown(edge, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(edge, { clientX: 40, pointerId: 1 });
    expect(screen.getByText("Frame · 460 px")).toBeTruthy();
    expect((container.firstChild as HTMLElement).style.transform).toBe("translate(-60px, 0px)");
  });

  it("is made taller from the bottom edge and, with the top edge, upward", () => {
    const { container } = render(<Frame defaultWidth={400}>x</Frame>);
    select();
    const frame = container.querySelector("[class*=Frame]:not([class*=Wrap])") as HTMLElement;
    // No layout in jsdom: the frame is as tall as its content made it, 100px.
    Object.defineProperty(frame, "offsetHeight", { configurable: true, value: 100 });
    const bottom = captured(handle("bottom"));
    fireEvent.pointerDown(bottom, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(bottom, { clientY: 160, pointerId: 1 });
    expect(frame.style.height).toBe("160px");
    fireEvent.pointerUp(bottom, { pointerId: 1 });
    const top = captured(handle("top"));
    fireEvent.pointerDown(top, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(top, { clientY: 70, pointerId: 1 });
    expect(frame.style.height).toBe("190px");
    expect((container.firstChild as HTMLElement).style.transform).toBe("translate(0px, -30px)");
  });

  it("a corner resizes both ways at once", () => {
    const { container } = render(<Frame defaultWidth={400}>x</Frame>);
    select();
    const frame = container.querySelector("[class*=Frame]:not([class*=Wrap])") as HTMLElement;
    Object.defineProperty(frame, "offsetHeight", { configurable: true, value: 100 });
    const se = captured(corner("se"));
    fireEvent.pointerDown(se, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(se, { clientX: 50, clientY: 90, pointerId: 1 });
    expect(frame.style.width).toBe("450px");
    expect(frame.style.height).toBe("190px");
  });

  it("only the sides are keyboard separators: the corners are for the pointer", () => {
    render(<Frame defaultWidth={400}>x</Frame>);
    select();
    expect(corner("ne").getAttribute("aria-hidden")).toBe("true");
    expect(corner("ne").hasAttribute("tabindex")).toBe(false);
  });

  it("does not resize a side across its direction: a bottom edge ignores ArrowRight", () => {
    render(<Frame defaultWidth={400}>x</Frame>);
    select();
    fireEvent.keyDown(handle("bottom"), { key: "ArrowRight" });
    expect(screen.getByText("Frame · 400 px")).toBeTruthy();
  });
});
