import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Frame } from "./Frame";
import { useScreenWidth } from "./screen";

const Probe = () => <span data-testid="seen">{String(useScreenWidth())}</span>;

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

  it("is made wider and narrower from the keyboard, five times as much with Shift, and stays within limits", () => {
    render(<Frame defaultWidth={720}>x</Frame>);
    const handle = screen.getByRole("separator", { name: "Resize frame" });
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle.getAttribute("aria-valuenow")).toBe("736");
    fireEvent.keyDown(handle, { key: "ArrowLeft", shiftKey: true });
    expect(handle.getAttribute("aria-valuenow")).toBe("656");
    for (let i = 0; i < 100; i++) fireEvent.keyDown(handle, { key: "ArrowLeft", shiftKey: true });
    expect(handle.getAttribute("aria-valuenow")).toBe("240");
    expect(screen.getByText("Frame · 240 px")).toBeTruthy();
  });

  it("is dragged by its edge: the pointer moves it as far as it moves", () => {
    render(<Frame defaultWidth={400}>x</Frame>);
    const handle = screen.getByRole("separator", { name: "Resize frame" });
    handle.setPointerCapture = () => undefined;
    handle.releasePointerCapture = () => undefined;
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 260, pointerId: 1 });
    expect(handle.getAttribute("aria-valuenow")).toBe("560");
    fireEvent.pointerUp(handle, { pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 900, pointerId: 1 });
    expect(handle.getAttribute("aria-valuenow")).toBe("560");
  });
});
