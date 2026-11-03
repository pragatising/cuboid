import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Frame } from "../../frame";
import { Canvas } from "./Canvas";

const two = () =>
  render(
    <Canvas label="Canvas">
      <Frame defaultWidth={400} name="First">
        a
      </Frame>
      <Frame defaultWidth={400} name="Second">
        b
      </Frame>
    </Canvas>,
  );
// The canvas captures the pointer to pan on an empty press; jsdom has no capture.
const stubCapture = () => {
  const canvas = screen.getByRole("application");
  canvas.setPointerCapture = () => undefined;
  canvas.releasePointerCapture = () => undefined;
  return canvas;
};
const pressed = (name: string) => screen.getByRole("button", { name }).getAttribute("aria-pressed");

describe("selecting on the canvas", () => {
  it("selects one frame at a time: selecting another lets go of the first", () => {
    two();
    fireEvent.click(screen.getByRole("button", { name: "First" }));
    expect(pressed("First")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Second" }));
    expect(pressed("First")).toBe("false");
    expect(pressed("Second")).toBe("true");
    expect(document.querySelectorAll("[data-handle]")).toHaveLength(8);
  });

  it("lets go when the empty canvas is pressed", () => {
    two();
    fireEvent.click(screen.getByRole("button", { name: "First" }));
    fireEvent.pointerDown(stubCapture(), { button: 0, pointerId: 1 });
    expect(pressed("First")).toBe("false");
    expect(document.querySelectorAll("[data-handle]")).toHaveLength(0);
  });

  it("does not let go when the press is on the frame", () => {
    two();
    fireEvent.click(screen.getByRole("button", { name: "First" }));
    fireEvent.pointerDown(screen.getByText("a"), { button: 0, pointerId: 1 });
    expect(pressed("First")).toBe("true");
  });

  it("lets go on Escape", () => {
    two();
    fireEvent.click(screen.getByRole("button", { name: "First" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "First" }), { key: "Escape" });
    expect(pressed("First")).toBe("false");
  });
});
