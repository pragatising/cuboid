import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { expectNoAxeViolations } from "../../../test/testing";
import { Sheet } from "./Sheet";

const sheet = () => screen.queryByRole("dialog");

describe("Sheet", () => {
  it("renders nothing while closed", () => {
    render(<Sheet aria-label="Panel">x</Sheet>);
    expect(sheet()).not.toBeInTheDocument();
  });

  it("portals a labelled modal dialog to document.body when open", () => {
    const { container } = render(<Sheet open aria-label="Panel">Content</Sheet>);
    expect(container).toBeEmptyDOMElement();
    const dialog = screen.getByRole("dialog", { name: "Panel" });
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("Content");
  });

  it("is not modal without a scrim", () => {
    render(<Sheet open modal={false} aria-label="Panel">x</Sheet>);
    expect(sheet()).not.toHaveAttribute("aria-modal");
    expect(document.body.querySelector('[data-component="Overlay"]')).not.toBeInTheDocument();
  });

  it("renders a sheet scrim when modal and locks page scroll while open", () => {
    const { unmount } = render(<Sheet open aria-label="Panel">x</Sheet>);
    expect(document.body.querySelector('[data-component="Overlay"]')).toHaveAttribute("data-variant", "sheet");
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("styles the panel from the sheet, shadow and zIndex tokens", () => {
    render(<Sheet open aria-label="Panel">x</Sheet>);
    const dialog = sheet() as HTMLElement;
    expect(dialog).toHaveStyle({ backgroundColor: tokens.light.sheet.color.background });
    expect(dialog.style.zIndex).toBe(String(tokens.light.zIndex.sheet));
    expect(dialog.style.maxWidth).toBe(tokens.light.sheet.sizes.maxWidth);
  });

  it.each(["sm", "md"] as const)("takes the %s width stop from the tokens", (stop) => {
    render(<Sheet open width={stop} aria-label="Panel">x</Sheet>);
    expect((sheet() as HTMLElement).style.width).toBe(tokens.light.sheet.sizes.width[stop]);
  });

  it("takes any CSS length as a width", () => {
    render(<Sheet open width="28rem" aria-label="Panel">x</Sheet>);
    expect((sheet() as HTMLElement).style.width).toBe("28rem");
  });

  it("slides from the chosen edge", () => {
    render(<Sheet open edge="left" aria-label="Panel">x</Sheet>);
    expect(sheet()).toHaveAttribute("data-edge", "left");
  });

  it("rounds the top corners of a bottom sheet by default, and not when roundedTop is false", () => {
    const { rerender } = render(<Sheet open edge="bottom" aria-label="Panel">x</Sheet>);
    expect((sheet() as HTMLElement).style.borderRadius).toContain(tokens.light.sheet.sizes.bottomCornerRadius);
    rerender(<Sheet open edge="bottom" roundedTop={false} aria-label="Panel">x</Sheet>);
    expect((sheet() as HTMLElement).style.borderRadius).toBe("");
  });

  it("dismisses on Escape and on a scrim click", async () => {
    const onDismiss = vi.fn();
    render(<Sheet open onDismiss={onDismiss} aria-label="Panel">x</Sheet>);
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await userEvent.click(document.body.querySelector('[data-component="Overlay"]') as HTMLElement);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it("offers a resize handle only when resizable on a side edge", () => {
    const { rerender } = render(<Sheet open aria-label="Panel">x</Sheet>);
    expect(screen.queryByRole("button", { name: "Resize sheet" })).not.toBeInTheDocument();
    rerender(<Sheet open resizable aria-label="Panel">x</Sheet>);
    expect(screen.getByRole("button", { name: "Resize sheet" })).toBeInTheDocument();
    rerender(<Sheet open resizable edge="bottom" aria-label="Panel">x</Sheet>);
    expect(screen.queryByRole("button", { name: "Resize sheet" })).not.toBeInTheDocument();
  });

  it("pads its header and body from the sheet token", () => {
    render(
      <Sheet open aria-label="Panel">
        <Sheet.Header>Head</Sheet.Header>
        <Sheet.Body>Body</Sheet.Body>
      </Sheet>,
    );
    expect((screen.getByText("Head") as HTMLElement).style.padding).toBe(tokens.light.sheet.sizes.padding);
    expect((screen.getByText("Body") as HTMLElement).style.paddingInline).toBe(tokens.light.sheet.sizes.padding);
  });

  it("merges the consumer's className and style", () => {
    render(<Sheet open className="mine" style={{ opacity: 0.5 }} aria-label="Panel">x</Sheet>);
    expect(sheet()).toHaveClass("mine");
    expect(sheet()).toHaveStyle({ opacity: "0.5" });
  });

  it("uses the dark tokens in dark mode", () => {
    act(() => setMode("dark"));
    render(<Sheet open aria-label="Panel">x</Sheet>);
    expect(sheet()).toHaveStyle({ backgroundColor: tokens.dark.sheet.color.background });
  });

  it("has no axe violations", async () => {
    render(
      <Sheet open aria-label="Panel">
        <Sheet.Body>Body</Sheet.Body>
      </Sheet>,
    );
    await expectNoAxeViolations(sheet() as HTMLElement);
  });
});

describe("Sheet (non-modal dismissal)", () => {
  it("still dismisses on Escape without a scrim", async () => {
    const onDismiss = vi.fn();
    render(<Sheet open modal={false} onDismiss={onDismiss} aria-label="Panel">x</Sheet>);
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
