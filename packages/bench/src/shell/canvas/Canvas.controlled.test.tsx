import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Frame } from "../../frame";
import { Canvas } from "./Canvas";

// Whoever draws the canvas can keep what is selected (the right pane reads it), and the canvas lets go through them too.
function Kept() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <output aria-label="kept">{selected ?? "nothing"}</output>
      <Canvas label="Canvas" selected={selected} onSelectedChange={setSelected}>
        <Frame defaultWidth={400} name="First" id="first">
          a
        </Frame>
      </Canvas>
    </>
  );
}

describe("a canvas whose selection is kept outside it", () => {
  it("tells who keeps it which frame was selected, and when it is let go", () => {
    render(<Kept />);
    fireEvent.click(screen.getByRole("button", { name: "First" }));
    expect(screen.getByLabelText("kept").textContent).toBe("first");
    fireEvent.keyDown(screen.getByRole("button", { name: "First" }), { key: "Escape" });
    expect(screen.getByLabelText("kept").textContent).toBe("nothing");
  });
});
