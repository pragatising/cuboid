import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FrameFacts } from "./FrameFacts";
import { FramesProvider, useFrames } from "./FrameStore";

afterEach(cleanup);

// A frame tells the store its size as it is dragged; here a stand-in does it.
function Reporter({ id, width, height }: { id: string; width: number; height: number }) {
  const report = useFrames()!.report;
  React.useEffect(() => report(id, { width, height }), [report, id, width, height]);
  return null;
}
const device = (id: string) => {
  let seen = "";
  function Read() {
    seen = useFrames()!.deviceOf(id);
    return null;
  }
  return { Read, now: () => seen };
};

describe("the frame's facts in the pane", () => {
  it("shows the size the frame reports, and follows it as it changes", () => {
    const { rerender } = render(
      <FramesProvider>
        <Reporter id="a" width={480} height={295} />
        <FrameFacts id="a" />
      </FramesProvider>,
    );
    expect(screen.getByLabelText("Size").textContent).toBe("480 × 295");
    rerender(
      <FramesProvider>
        <Reporter id="a" width={600} height={300} />
        <FrameFacts id="a" />
      </FramesProvider>,
    );
    expect(screen.getByLabelText("Size").textContent).toBe("600 × 300");
  });

  it("chooses the screen for this frame only", () => {
    const a = device("a");
    const b = device("b");
    render(
      <FramesProvider>
        <a.Read />
        <b.Read />
        <FrameFacts id="a" />
      </FramesProvider>,
    );
    expect(a.now()).toBe("none");
    fireEvent.click(screen.getByRole("button", { name: /^Device:/ }));
    act(() => void fireEvent.click(screen.getByRole("menuitemradio", { name: /iPhone/ })));
    expect(a.now()).toBe("phone");
    expect(b.now()).toBe("none");
    expect(screen.getByRole("button", { name: /^Device: Phone/ })).toBeTruthy();
  });
});
