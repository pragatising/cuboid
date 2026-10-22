import { render, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useProvidedRefOrCreate } from "./useProvidedRefOrCreate";

function Probe({ provided, onRef }: { provided?: React.Ref<HTMLDivElement>; onRef?: (ref: React.RefObject<HTMLDivElement | null>) => void }) {
  const ref = useProvidedRefOrCreate(provided);
  onRef?.(ref);
  return <div ref={ref} data-testid="el" />;
}

describe("useProvidedRefOrCreate", () => {
  it("returns the caller's own object ref", () => {
    const provided = createRef<HTMLDivElement>();
    const { result } = renderHook(() => useProvidedRefOrCreate(provided));
    expect(result.current).toBe(provided);
  });

  it("creates a ref when none is provided, and it holds the element", () => {
    let ref: React.RefObject<HTMLDivElement | null> | undefined;
    const { getByTestId } = render(<Probe onRef={(r) => (ref = r)} />);
    expect(ref?.current).toBe(getByTestId("el"));
  });

  it("forwards the element to a callback ref the caller provided, and null on unmount", () => {
    const callback = vi.fn();
    let ref: React.RefObject<HTMLDivElement | null> | undefined;
    const { getByTestId, unmount } = render(<Probe provided={callback} onRef={(r) => (ref = r)} />);
    expect(callback).toHaveBeenCalledWith(getByTestId("el"));
    expect(ref?.current).toBe(getByTestId("el"));
    unmount();
    expect(callback).toHaveBeenLastCalledWith(null);
  });

  it("fills the caller's object ref too", () => {
    const provided = createRef<HTMLDivElement>();
    const { getByTestId } = render(<Probe provided={provided} />);
    expect(provided.current).toBe(getByTestId("el"));
  });

  it("the created ref keeps its identity across renders", () => {
    const seen: unknown[] = [];
    const { rerender } = render(<Probe onRef={(r) => seen.push(r)} />);
    rerender(<Probe onRef={(r) => seen.push(r)} />);
    expect(seen[0]).toBe(seen[seen.length - 1]);
  });

  it("forwards to the latest callback when it changes between renders", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = render(<Probe provided={first} />);
    rerender(<Probe provided={second} />);
    unmount();
    expect(second).toHaveBeenLastCalledWith(null);
  });
});
