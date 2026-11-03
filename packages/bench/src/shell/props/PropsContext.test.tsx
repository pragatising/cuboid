import React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentDoc } from "../../engine/types";
import { PropsProvider, useProps } from "./PropsContext";

const doc = { props: [] } as unknown as ComponentDoc;
const base = (component: string, scope?: string) => ({ component, doc, node: { tag: component }, ...(scope ? { scope } : {}) });
const wrapper = ({ children }: { children: React.ReactNode }) => <PropsProvider>{children}</PropsProvider>;
const hook = () => renderHook(() => useProps()!, { wrapper });

describe("the props the pane and the canvas share", () => {
  it("keeps what is changed for the scope that is selected", () => {
    const { result } = hook();
    act(() => result.current.setBase(base("Table", "Table:Default")));
    act(() => result.current.change("density", "dense"));
    expect(result.current.overrides).toEqual({ density: "dense" });
    act(() => result.current.reset());
    expect(result.current.overrides).toEqual({});
  });

  it("keeps each frame's changes apart: selecting another shows its own, and the first stays as it was set", () => {
    const { result } = hook();
    act(() => result.current.setBase(base("Table", "Table:Default")));
    act(() => result.current.change("density", "dense"));
    act(() => result.current.setBase(base("Table", "Table:Loading")));
    expect(result.current.overrides).toEqual({});
    act(() => result.current.change("lines", "rows"));
    // The frame that is not selected is still drawn with its changes.
    expect(result.current.overridesOf("Table:Default")).toEqual({ density: "dense" });
    expect(result.current.overridesOf("Table:Loading")).toEqual({ lines: "rows" });
  });

  it("does not lose a frame's changes when nothing is selected for a while", () => {
    const { result } = hook();
    act(() => result.current.setBase(base("Table", "Table:Default")));
    act(() => result.current.change("density", "dense"));
    act(() => result.current.setBase(null));
    expect(result.current.overridesOf("Table:Default")).toEqual({ density: "dense" });
    act(() => result.current.setBase(base("Table", "Table:Default")));
    expect(result.current.overrides).toEqual({ density: "dense" });
  });

  it("drops the changes when another component is opened", () => {
    const { result } = hook();
    act(() => result.current.setBase(base("Table", "Table:Default")));
    act(() => result.current.change("density", "dense"));
    act(() => result.current.setBase(base("Button")));
    expect(result.current.overridesOf("Table:Default")).toBeUndefined();
    expect(result.current.overrides).toEqual({});
  });

  it("is the component's own scope when none is given (the Playground)", () => {
    const { result } = hook();
    act(() => result.current.setBase(base("Button")));
    act(() => result.current.change("size", "lg"));
    expect(result.current.overridesOf("Button")).toEqual({ size: "lg" });
  });

  it("changes nothing while nothing is selected", () => {
    const { result } = hook();
    act(() => result.current.change("size", "lg"));
    expect(result.current.overrides).toEqual({});
  });
});
