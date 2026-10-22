import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRovingFocus } from "./useRovingFocus";
import type { RovingFocusOptions } from "./useRovingFocus";

type HarnessProps = Partial<Omit<RovingFocusOptions, "containerRef">> & { items?: { label: string; disabled?: boolean; checked?: boolean }[]; onReady?: (api: ReturnType<typeof useRovingFocus>) => void };

function Harness({ items = [{ label: "Edit" }, { label: "Duplicate" }, { label: "Delete" }], onReady, ...options }: HarnessProps) {
  const ref = useRef<HTMLDivElement>(null);
  const api = useRovingFocus({ containerRef: ref, ...options });
  onReady?.(api);
  return (
    <div ref={ref} onKeyDown={api.onKeyDown} role="menu" tabIndex={-1}>
      {items.map((item) => (
        <button key={item.label} role="menuitem" disabled={item.disabled} aria-checked={item.checked ? true : undefined}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

const focused = () => document.activeElement?.textContent;
afterEach(() => vi.useRealTimers());

describe("useRovingFocus: arrows, Home, End", () => {
  it("ArrowDown and ArrowUp move through the items, and wrap", async () => {
    render(<Harness />);
    screen.getByRole("menuitem", { name: "Edit" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("Duplicate");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(focused()).toBe("Edit");
    await userEvent.keyboard("{ArrowUp}");
    expect(focused()).toBe("Delete");
  });

  it("does not wrap when loop is off", async () => {
    render(<Harness loop={false} />);
    screen.getByRole("menuitem", { name: "Delete" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("Delete");
    screen.getByRole("menuitem", { name: "Edit" }).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(focused()).toBe("Edit");
  });

  it("Home and End jump to the ends", async () => {
    render(<Harness />);
    screen.getByRole("menuitem", { name: "Duplicate" }).focus();
    await userEvent.keyboard("{End}");
    expect(focused()).toBe("Delete");
    await userEvent.keyboard("{Home}");
    expect(focused()).toBe("Edit");
  });

  it("skips disabled items", async () => {
    render(<Harness items={[{ label: "A" }, { label: "B", disabled: true }, { label: "C" }]} />);
    screen.getByRole("menuitem", { name: "A" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("C");
    await userEvent.keyboard("{End}");
    expect(focused()).toBe("C");
  });

  it("ArrowUp from outside the items goes to the last", async () => {
    render(<Harness />);
    act(() => screen.getByRole("menu").focus());
    await userEvent.keyboard("{ArrowUp}");
    expect(focused()).toBe("Delete");
  });

  it("uses Left and Right when horizontal", async () => {
    render(<Harness orientation="horizontal" />);
    screen.getByRole("menuitem", { name: "Edit" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(focused()).toBe("Edit");
    await userEvent.keyboard("{ArrowRight}");
    expect(focused()).toBe("Duplicate");
  });

  it("does nothing, and does not prevent keys, for an empty container", () => {
    render(<Harness items={[]} />);
    expect(() => act(() => screen.getByRole("menu").focus())).not.toThrow();
  });
});

describe("useRovingFocus: typeahead", () => {
  it("typing jumps to the next item starting with the character", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Harness items={[{ label: "Apple" }, { label: "Banana" }, { label: "Blueberry" }, { label: "Cherry" }]} />);
    screen.getByRole("menuitem", { name: "Apple" }).focus();
    await userEvent.keyboard("c");
    expect(focused()).toBe("Cherry");
    await act(() => vi.advanceTimersByTimeAsync(600));
    await userEvent.keyboard("b");
    expect(focused()).toBe("Banana");
  });

  it("repeating a character cycles through the matches", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Harness items={[{ label: "Apple" }, { label: "Banana" }, { label: "Blueberry" }]} />);
    screen.getByRole("menuitem", { name: "Apple" }).focus();
    await userEvent.keyboard("b");
    expect(focused()).toBe("Banana");
    await act(() => vi.advanceTimersByTimeAsync(600));
    await userEvent.keyboard("b");
    expect(focused()).toBe("Blueberry");
  });

  it("a longer prefix refines the match, and the buffer resets after a pause", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Harness items={[{ label: "Banana" }, { label: "Blueberry" }, { label: "Cherry" }]} />);
    screen.getByRole("menuitem", { name: "Cherry" }).focus();
    await userEvent.keyboard("bl");
    expect(focused()).toBe("Blueberry");
    await act(() => vi.advanceTimersByTimeAsync(600));
    await userEvent.keyboard("c");
    expect(focused()).toBe("Cherry");
  });

  it("is case-insensitive and ignores modified keys", async () => {
    render(<Harness items={[{ label: "Apple" }, { label: "Cherry" }]} />);
    screen.getByRole("menuitem", { name: "Apple" }).focus();
    await userEvent.keyboard("{Control>}c{/Control}");
    expect(focused()).toBe("Apple");
    await userEvent.keyboard("C");
    expect(focused()).toBe("Cherry");
  });

  it("can be turned off", async () => {
    render(<Harness typeahead={false} items={[{ label: "Apple" }, { label: "Cherry" }]} />);
    screen.getByRole("menuitem", { name: "Apple" }).focus();
    await userEvent.keyboard("c");
    expect(focused()).toBe("Apple");
  });

  it("does not move for a character nothing starts with", async () => {
    render(<Harness />);
    screen.getByRole("menuitem", { name: "Edit" }).focus();
    await userEvent.keyboard("z");
    expect(focused()).toBe("Edit");
  });
});

describe("useRovingFocus: helpers", () => {
  it("focusFirst focuses the first enabled item", () => {
    let api!: ReturnType<typeof useRovingFocus>;
    render(<Harness items={[{ label: "A", disabled: true }, { label: "B" }]} onReady={(a) => (api = a)} />);
    act(() => api.focusFirst());
    expect(focused()).toBe("B");
  });

  it("focusSelected focuses the checked item, else the first", () => {
    let api!: ReturnType<typeof useRovingFocus>;
    render(<Harness items={[{ label: "A" }, { label: "B", checked: true }]} onReady={(a) => (api = a)} />);
    act(() => api.focusSelected());
    expect(focused()).toBe("B");
  });
});
