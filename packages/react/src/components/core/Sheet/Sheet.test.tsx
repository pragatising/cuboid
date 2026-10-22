import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { expectNoAxeViolations } from "../../../test/testing";
import { Sheet } from "./Sheet";
import type { SheetProps } from "./Sheet";

const dialog = () => screen.queryByRole("dialog");
const overlay = () => document.body.querySelector('[data-component="Overlay"]') as HTMLElement | null;
const sheet = (props: Partial<SheetProps> = {}) =>
  render(
    <Sheet open aria-label="Panel" {...props}>
      <Sheet.Body>
        <button>first</button>
        <button>second</button>
      </Sheet.Body>
    </Sheet>,
  );

/** A trigger that owns the open state, the way an app would. */
function WithTrigger({ modal = true, onOpenChange }: { modal?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>opener</button>
      <button>elsewhere</button>
      <Sheet
        open={open}
        modal={modal}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
        aria-label="Panel"
      >
        <Sheet.Body>
          <button>first</button>
          <button onClick={() => setOpen(false)}>close</button>
        </Sheet.Body>
      </Sheet>
    </>
  );
}

describe("Sheet: rendering", () => {
  it("renders nothing while closed", () => {
    render(<Sheet aria-label="Panel">x</Sheet>);
    expect(dialog()).not.toBeInTheDocument();
  });

  it("portals a named dialog to document.body when open", () => {
    const { container } = sheet();
    expect(container).toBeEmptyDOMElement();
    expect(screen.getByRole("dialog", { name: "Panel" }).parentElement).toBe(document.body);
  });

  it("can be named by aria-labelledby", () => {
    render(
      <>
        <h2 id="t">Filters</h2>
        <Sheet open aria-labelledby="t">x</Sheet>
      </>,
    );
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  });

  it("warns in development when it has no name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // @ts-expect-error the types require a name; a JavaScript caller is what the warning is for
    render(<Sheet open>x</Sheet>);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Sheet needs an accessible name"));
    warn.mockRestore();
  });

  it("styles the panel from the sheet, shadow and zIndex tokens", () => {
    sheet();
    expect(dialog()).toHaveStyle({ backgroundColor: tokens.light.sheet.color.background });
    expect((dialog() as HTMLElement).style.zIndex).toBe(String(tokens.light.zIndex.sheet));
    expect((dialog() as HTMLElement).style.maxWidth).toBe(tokens.light.sheet.sizes.maxWidth);
  });

  it.each(["sm", "md"] as const)("takes the %s width stop from the tokens", (stop) => {
    sheet({ width: stop });
    expect((dialog() as HTMLElement).style.width).toBe(tokens.light.sheet.sizes.width[stop]);
  });

  it("takes a step of the Nx scale or any CSS length as a width", () => {
    const { rerender } = sheet({ width: "40x" });
    expect((dialog() as HTMLElement).style.width).toBe(tokens.light.size["320"]);
    rerender(<Sheet open aria-label="Panel" width="28rem">x</Sheet>);
    expect((dialog() as HTMLElement).style.width).toBe("28rem");
  });

  it("slides from the chosen edge", () => {
    sheet({ edge: "left" });
    expect(dialog()).toHaveAttribute("data-edge", "left");
    expect((dialog() as HTMLElement).style.left).toBe("0px");
  });

  it("rounds the top corners of a bottom sheet by default, and not when roundedTop is false", () => {
    const { rerender } = sheet({ edge: "bottom" });
    expect((dialog() as HTMLElement).style.borderRadius).toContain(tokens.light.sheet.sizes.bottomCornerRadius);
    rerender(<Sheet open aria-label="Panel" edge="bottom" roundedTop={false}>x</Sheet>);
    expect((dialog() as HTMLElement).style.borderRadius).toBe("");
  });

  it("pads its header and body from the sheet token", () => {
    render(
      <Sheet open aria-label="Panel">
        <Sheet.Header>Head</Sheet.Header>
        <Sheet.Body>Body</Sheet.Body>
      </Sheet>,
    );
    expect(screen.getByText("Head").style.padding).toBe(tokens.light.sheet.sizes.padding);
    expect(screen.getByText("Body").style.paddingInline).toBe(tokens.light.sheet.sizes.padding);
  });

  it("merges the consumer's className, style and ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Sheet open aria-label="Panel" className="mine" style={{ opacity: 0.5 }} ref={ref}>x</Sheet>);
    expect(dialog()).toHaveClass("mine");
    expect(dialog()).toHaveStyle({ opacity: "0.5" });
    expect(ref.current).toBe(dialog());
  });

  it("uses the dark tokens in dark mode", () => {
    act(() => setMode("dark"));
    sheet();
    expect(dialog()).toHaveStyle({ backgroundColor: tokens.dark.sheet.color.background });
  });
});

describe("Sheet: open state is open / defaultOpen / onOpenChange", () => {
  it("opens from defaultOpen and manages itself, reporting changes", async () => {
    const onOpenChange = vi.fn();
    render(<Sheet defaultOpen aria-label="Panel" onOpenChange={onOpenChange}>x</Sheet>);
    expect(dialog()).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog()).not.toBeInTheDocument();
  });

  it("when controlled, only asks: it stays open until the caller says otherwise", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Sheet open aria-label="Panel" onOpenChange={onOpenChange}>x</Sheet>);
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog()).toBeInTheDocument();
    rerender(<Sheet open={false} aria-label="Panel" onOpenChange={onOpenChange}>x</Sheet>);
    expect(dialog()).not.toBeInTheDocument();
  });

  it("a click on the scrim asks to close", async () => {
    const onOpenChange = vi.fn();
    sheet({ onOpenChange });
    await userEvent.click(overlay() as HTMLElement);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("Escape asks once, not twice (the scrim and the sheet do not both answer)", async () => {
    const onOpenChange = vi.fn();
    sheet({ onOpenChange });
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});

describe("Sheet: modal (focus, scrim, scroll)", () => {
  it("is aria-modal and renders a sheet scrim", () => {
    sheet();
    expect(dialog()).toHaveAttribute("aria-modal", "true");
    expect(overlay()).toHaveAttribute("data-variant", "sheet");
  });

  it("moves focus into the sheet when it opens", async () => {
    render(<WithTrigger />);
    await userEvent.click(screen.getByRole("button", { name: "opener" }));
    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("keeps Tab inside the sheet: from the last control it wraps to the first, and back", async () => {
    render(<WithTrigger />);
    await userEvent.click(screen.getByRole("button", { name: "opener" }));
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "close" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole("button", { name: "close" })).toHaveFocus();
  });

  it("pulls focus back if it lands on the page behind", async () => {
    render(<WithTrigger />);
    await userEvent.click(screen.getByRole("button", { name: "opener" }));
    screen.getByRole("button", { name: "elsewhere" }).focus();
    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("gives focus back to the opener on close, by Escape and by a control inside it", async () => {
    render(<WithTrigger />);
    await userEvent.click(screen.getByRole("button", { name: "opener" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "opener" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "opener" }));
    await userEvent.click(screen.getByRole("button", { name: "close" }));
    expect(screen.getByRole("button", { name: "opener" })).toHaveFocus();
  });

  it("locks page scroll while open, and unlocks on close", () => {
    const { unmount } = sheet();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});

describe("Sheet: non-modal", () => {
  it("has no scrim, is not aria-modal, and does not lock scroll", () => {
    sheet({ modal: false });
    expect(overlay()).not.toBeInTheDocument();
    expect(dialog()).not.toHaveAttribute("aria-modal");
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("does not trap focus", async () => {
    render(<WithTrigger modal={false} />);
    await userEvent.click(screen.getByRole("button", { name: "opener" }));
    screen.getByRole("button", { name: "elsewhere" }).focus();
    expect(screen.getByRole("button", { name: "elsewhere" })).toHaveFocus();
  });

  it("still closes on Escape, once", async () => {
    const onOpenChange = vi.fn();
    sheet({ modal: false, onOpenChange });
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });
});

describe("Sheet: resizing (pointer and keyboard)", () => {
  it("offers a labelled separator only when resizable on a side edge", () => {
    const { rerender } = sheet();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    rerender(<Sheet open resizable aria-label="Panel">x</Sheet>);
    expect(screen.getByRole("separator", { name: "Resize sheet" })).toBeInTheDocument();
    rerender(<Sheet open resizable edge="bottom" aria-label="Panel">x</Sheet>);
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("resizes with the arrow keys, reporting the width", async () => {
    const onWidthChange = vi.fn();
    sheet({ resizable: true, onWidthChange });
    const start = parseFloat(tokens.light.sheet.sizes.width.md) * 16;
    screen.getByRole("separator").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onWidthChange).toHaveBeenLastCalledWith(start + 16);
    expect((dialog() as HTMLElement).style.width).toBe(`${start + 16}px`);
  });

  it("forgets the dragged width when it closes", async () => {
    const { rerender } = sheet({ resizable: true });
    screen.getByRole("separator").focus();
    await userEvent.keyboard("{ArrowLeft}");
    rerender(<Sheet open={false} resizable aria-label="Panel">x</Sheet>);
    rerender(<Sheet open resizable aria-label="Panel">x</Sheet>);
    expect((dialog() as HTMLElement).style.width).toBe(tokens.light.sheet.sizes.width.md);
  });
});

describe("Sheet: accessibility", () => {
  it("has no axe violations", async () => {
    render(
      <Sheet open resizable aria-label="Panel">
        <Sheet.Header>Title</Sheet.Header>
        <Sheet.Body>Body</Sheet.Body>
      </Sheet>,
    );
    await expectNoAxeViolations(dialog() as HTMLElement);
  });
});
