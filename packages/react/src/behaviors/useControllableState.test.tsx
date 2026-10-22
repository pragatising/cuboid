import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useControllableState } from "./useControllableState";

afterEach(() => vi.restoreAllMocks());

describe("useControllableState: uncontrolled", () => {
  it("starts at defaultValue and holds what it is set to", () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 1 }));
    expect(result.current[0]).toBe(1);
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
  });

  it("takes an updater, like useState", () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 1 }));
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(2);
  });

  it("two updaters in the same tick build on each other", () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 0 }));
    act(() => {
      result.current[1]((n) => n + 1);
      result.current[1]((n) => n + 1);
    });
    expect(result.current[0]).toBe(2);
  });

  it("calls onChange with the next value, so a caller can observe it", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultValue: false, onChange }));
    act(() => result.current[1](true));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("does not call onChange when the value does not change", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultValue: 3, onChange }));
    act(() => result.current[1](3));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("the setter keeps one identity across renders", () => {
    const { result, rerender } = renderHook(() => useControllableState({ defaultValue: 0 }));
    const first = result.current[1];
    act(() => first(1));
    rerender();
    expect(result.current[1]).toBe(first);
  });
});

describe("useControllableState: controlled", () => {
  it("shows the value it is given and ignores defaultValue", () => {
    const { result } = renderHook(() => useControllableState({ value: "a", defaultValue: "b" }));
    expect(result.current[0]).toBe("a");
  });

  it("asks for a change through onChange but does not change by itself", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook((props: { value: boolean }) => useControllableState({ value: props.value, defaultValue: false, onChange }), {
      initialProps: { value: false },
    });
    act(() => result.current[1](true));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(result.current[0]).toBe(false);
    rerender({ value: true });
    expect(result.current[0]).toBe(true);
  });

  it("a change the caller refuses can be asked for again", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ value: false, defaultValue: false, onChange }));
    act(() => result.current[1](true));
    act(() => result.current[1](true));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("an updater sees the controlled value", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ value: 10, defaultValue: 0, onChange }));
    act(() => result.current[1]((n) => n + 1));
    expect(onChange).toHaveBeenCalledWith(11);
  });

  it("warns, naming the state, when it switches between controlled and uncontrolled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = renderHook((props: { value?: boolean }) => useControllableState({ value: props.value, defaultValue: false, name: "open" }), {
      initialProps: { value: undefined as boolean | undefined },
    });
    expect(warn).not.toHaveBeenCalled();
    rerender({ value: true });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("open from uncontrolled to controlled"));
  });
});
