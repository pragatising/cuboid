import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useScrollLock } from "./useScrollLock";

afterEach(() => {
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

describe("useScrollLock", () => {
  it("hides the page's overflow while enabled and restores what was there", () => {
    document.body.style.overflow = "scroll";
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("does nothing while disabled, and starts when enabled", () => {
    const { rerender } = renderHook(({ on }) => useScrollLock(on), { initialProps: { on: false } });
    expect(document.body.style.overflow).toBe("");
    rerender({ on: true });
    expect(document.body.style.overflow).toBe("hidden");
    rerender({ on: false });
    expect(document.body.style.overflow).toBe("");
  });

  it("with several modals open, unlocks only when the last one closes", () => {
    const first = renderHook(() => useScrollLock(true));
    const second = renderHook(() => useScrollLock(true));
    first.unmount();
    expect(document.body.style.overflow).toBe("hidden");
    second.unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("does not lose the original overflow when locks nest", () => {
    document.body.style.overflow = "auto";
    const first = renderHook(() => useScrollLock(true));
    const second = renderHook(() => useScrollLock(true));
    second.unmount();
    first.unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});
