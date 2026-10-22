import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokenTrees from "@sragatiping/cuboid-primitives";
import { getMode, setMode, subscribeToMode, useMode, useTokens } from "./useTokens";

describe("mode store", () => {
  it("starts on the first mode the build emits", () => {
    expect(getMode()).toBe("light");
  });

  it("notifies subscribers once per actual change", () => {
    let calls = 0;
    const unsubscribe = subscribeToMode(() => calls++);
    setMode("dark");
    setMode("dark"); // no-op: same mode
    setMode("light");
    unsubscribe();
    expect(calls).toBe(2);
  });

  it("stops notifying after unsubscribe", () => {
    let calls = 0;
    subscribeToMode(() => calls++)();
    setMode("dark");
    expect(calls).toBe(0);
  });

  it("rejects an unknown mode and leaves the active mode untouched", () => {
    expect(() => setMode("sepia" as never)).toThrow(/Unknown mode "sepia"\. Available modes: light, dark/);
    expect(getMode()).toBe("light");
  });
});

describe("hooks", () => {
  const Probe = () => <span data-testid="probe">{`${useMode()}|${useTokens().selection.bgColor}`}</span>;

  it("the two modes differ for the probe token (otherwise these tests prove nothing)", () => {
    expect(tokenTrees.light.selection.bgColor).not.toBe(tokenTrees.dark.selection.bgColor);
  });

  it("useTokens returns the active mode's tree", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent(`light|${tokenTrees.light.selection.bgColor}`);
  });

  it("re-renders mounted readers when the mode changes", () => {
    render(<Probe />);
    act(() => setMode("dark"));
    expect(screen.getByTestId("probe")).toHaveTextContent(`dark|${tokenTrees.dark.selection.bgColor}`);
    act(() => setMode("light"));
    expect(screen.getByTestId("probe")).toHaveTextContent(`light|${tokenTrees.light.selection.bgColor}`);
  });
});
