import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { useResizable } from "./useResizable";
import type { ResizableOptions } from "./useResizable";

function Harness({ start = 200, ...options }: Partial<Omit<ResizableOptions, "value" | "onChange">> & { start?: number; onChange?: (n: number) => void }) {
  const [value, setValue] = useState(start);
  const { separatorProps, dragging } = useResizable({ min: 100, max: 400, ...options, value, onChange: (n) => { setValue(n); options.onChange?.(n); } });
  return <div data-testid="handle" data-dragging={dragging || undefined} {...separatorProps}>{value}</div>;
}

const handle = () => screen.getByTestId("handle");
const capture = () => {
  handle().setPointerCapture = vi.fn();
  handle().hasPointerCapture = vi.fn(() => true);
  handle().releasePointerCapture = vi.fn();
};

describe("useResizable: the separator semantics", () => {
  it("is a focusable separator with its orientation and value range", () => {
    render(<Harness />);
    expect(handle()).toHaveAttribute("role", "separator");
    expect(handle()).toHaveAttribute("tabindex", "0");
    expect(handle()).toHaveAttribute("aria-orientation", "vertical");
    expect(handle()).toHaveAttribute("aria-valuenow", "200");
    expect(handle()).toHaveAttribute("aria-valuemin", "100");
    expect(handle()).toHaveAttribute("aria-valuemax", "400");
  });

  it("reports a horizontal orientation", () => {
    render(<Harness orientation="horizontal" />);
    expect(handle()).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("keeps aria-valuenow current as the size changes", async () => {
    render(<Harness />);
    handle().focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(handle()).toHaveAttribute("aria-valuenow", "216");
  });
});

describe("useResizable: keyboard (the window-splitter pattern)", () => {
  it("Arrow keys move by step, Shift by five steps, Home and End to the bounds", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} step={10} />);
    handle().focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(210);
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith(200);
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(onChange).toHaveBeenLastCalledWith(250);
    await userEvent.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith(100);
    await userEvent.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith(400);
  });

  it("clamps to min and max, and does not call onChange when already at a bound", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} start={400} />);
    handle().focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith(384);
  });

  it("a horizontal separator uses Up and Down", async () => {
    const onChange = vi.fn();
    render(<Harness orientation="horizontal" onChange={onChange} step={10} />);
    handle().focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith(210);
    await userEvent.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith(200);
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("invert reverses which arrow grows it (a panel on the end edge)", async () => {
    const onChange = vi.fn();
    render(<Harness invert onChange={onChange} step={10} />);
    handle().focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith(210);
  });

  it("only prevents the default of keys it handles", () => {
    render(<Harness />);
    expect(fireEvent.keyDown(handle(), { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(handle(), { key: "a" })).toBe(true);
  });
});

describe("useResizable: pointer", () => {
  it("resizes by the pointer's movement along x for a vertical separator, and reports start and end", () => {
    const onChange = vi.fn();
    const onResizeStart = vi.fn();
    const onResizeEnd = vi.fn();
    render(<Harness onChange={onChange} onResizeStart={onResizeStart} onResizeEnd={onResizeEnd} />);
    capture();
    fireEvent.pointerDown(handle(), { clientX: 100, pointerId: 1 });
    expect(onResizeStart).toHaveBeenCalledOnce();
    expect(handle()).toHaveAttribute("data-dragging");
    fireEvent.pointerMove(handle(), { clientX: 130, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(230);
    fireEvent.pointerMove(handle(), { clientX: 150, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(250);
    fireEvent.pointerUp(handle(), { pointerId: 1 });
    expect(onResizeEnd).toHaveBeenCalledOnce();
    expect(handle()).not.toHaveAttribute("data-dragging");
  });

  it("uses y for a horizontal separator", () => {
    const onChange = vi.fn();
    render(<Harness orientation="horizontal" onChange={onChange} />);
    capture();
    fireEvent.pointerDown(handle(), { clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientY: 20, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(170);
  });

  it("invert grows it when the pointer moves toward the start", () => {
    const onChange = vi.fn();
    render(<Harness invert onChange={onChange} />);
    capture();
    fireEvent.pointerDown(handle(), { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientX: 70, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(230);
  });

  it("clamps to the bounds", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    capture();
    fireEvent.pointerDown(handle(), { clientX: 0, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientX: 5000, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(400);
  });

  it("ignores movement when not dragging, and works where pointer capture is missing", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.pointerMove(handle(), { clientX: 99, pointerId: 1 });
    expect(onChange).not.toHaveBeenCalled();
    expect(() => fireEvent.pointerDown(handle(), { clientX: 1, pointerId: 1 })).not.toThrow();
  });

  it("captures the pointer for the drag and releases it after", () => {
    render(<Harness />);
    capture();
    fireEvent.pointerDown(handle(), { clientX: 1, pointerId: 7 });
    expect(handle().setPointerCapture).toHaveBeenCalledWith(7);
    fireEvent.pointerUp(handle(), { pointerId: 7 });
    expect(handle().releasePointerCapture).toHaveBeenCalledWith(7);
  });
});
