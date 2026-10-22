import { fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useClickAway } from "./useClickAway";
import { useDismiss } from "./useDismiss";

function Harness({ onAway, enabled = true }: { onAway: (e: PointerEvent) => void; enabled?: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLButtonElement>(null);
  useClickAway([panel, anchor], onAway, enabled);
  return (
    <>
      <button ref={anchor} data-testid="anchor" />
      <div ref={panel} data-testid="panel"><span data-testid="inside" /></div>
      <p data-testid="outside" />
    </>
  );
}

describe("useClickAway", () => {
  it("calls the handler for a press outside every ref", () => {
    const onAway = vi.fn();
    const { getByTestId } = render(<Harness onAway={onAway} />);
    fireEvent.pointerDown(getByTestId("outside"));
    expect(onAway).toHaveBeenCalledOnce();
  });

  it("ignores a press inside any of the refs, including their descendants", () => {
    const onAway = vi.fn();
    const { getByTestId } = render(<Harness onAway={onAway} />);
    fireEvent.pointerDown(getByTestId("panel"));
    fireEvent.pointerDown(getByTestId("inside"));
    fireEvent.pointerDown(getByTestId("anchor"));
    expect(onAway).not.toHaveBeenCalled();
  });

  it("hears an outside press even if something stops propagation (capture phase)", () => {
    const onAway = vi.fn();
    const { getByTestId } = render(<Harness onAway={onAway} />);
    getByTestId("outside").addEventListener("pointerdown", (e) => e.stopPropagation());
    fireEvent.pointerDown(getByTestId("outside"));
    expect(onAway).toHaveBeenCalledOnce();
  });

  it("does nothing while disabled", () => {
    const onAway = vi.fn();
    const { getByTestId } = render(<Harness onAway={onAway} enabled={false} />);
    fireEvent.pointerDown(getByTestId("outside"));
    expect(onAway).not.toHaveBeenCalled();
  });

  it("takes a single ref as well as a list", () => {
    function One({ onAway }: { onAway: () => void }) {
      const ref = useRef<HTMLDivElement>(null);
      useClickAway(ref, onAway);
      return <><div ref={ref} data-testid="in" /><i data-testid="out" /></>;
    }
    const onAway = vi.fn();
    const { getByTestId } = render(<One onAway={onAway} />);
    fireEvent.pointerDown(getByTestId("in"));
    expect(onAway).not.toHaveBeenCalled();
    fireEvent.pointerDown(getByTestId("out"));
    expect(onAway).toHaveBeenCalledOnce();
  });
});

describe("useDismiss", () => {
  function Dismiss({ onDismiss, escape, clickAway, enabled = true }: { onDismiss: () => void; escape?: boolean; clickAway?: boolean; enabled?: boolean }) {
    const panel = useRef<HTMLDivElement>(null);
    useDismiss({ enabled, onDismiss, refs: panel, escape, clickAway });
    return <><div ref={panel} data-testid="panel" /><i data-testid="out" /></>;
  }

  it("dismisses on Escape and on an outside press", () => {
    const onDismiss = vi.fn();
    const { getByTestId } = render(<Dismiss onDismiss={onDismiss} />);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.pointerDown(getByTestId("out"));
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it("each way can be turned off", () => {
    const onDismiss = vi.fn();
    const { getByTestId, rerender } = render(<Dismiss onDismiss={onDismiss} escape={false} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();
    rerender(<Dismiss onDismiss={onDismiss} clickAway={false} />);
    fireEvent.pointerDown(getByTestId("out"));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does nothing while not enabled", () => {
    const onDismiss = vi.fn();
    render(<Dismiss onDismiss={onDismiss} enabled={false} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
