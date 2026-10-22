import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { renderInMode } from "../../../test/testing";
import { Overlay } from "./Overlay";

const scrim = () => document.body.querySelector('[data-component="Overlay"]') as HTMLElement | null;

describe("Overlay", () => {
  it("renders nothing while closed", () => {
    render(<Overlay />);
    expect(scrim()).not.toBeInTheDocument();
  });

  it("portals the scrim to document.body when open", () => {
    const { container } = render(<Overlay open />);
    expect(container).toBeEmptyDOMElement();
    expect(scrim()?.parentElement).toBe(document.body);
  });

  it("is hidden from assistive technology and not focusable", () => {
    render(<Overlay open />);
    expect(scrim()).toHaveAttribute("aria-hidden", "true");
    expect(scrim()).toHaveAttribute("tabindex", "-1");
  });

  it.each(["modal", "sheet", "none"] as const)("uses the %s colour and the overlay z-index tokens", (variant) => {
    render(<Overlay open variant={variant} />);
    expect(scrim()).toHaveStyle({ backgroundColor: tokens.light.overlay.color[variant] });
    expect(scrim()?.style.zIndex).toBe(String(tokens.light.zIndex.overlay));
  });

  it("is a modal scrim by default", () => {
    render(<Overlay open />);
    expect(scrim()).toHaveAttribute("data-variant", "modal");
  });

  it("dismisses on click and on Escape", async () => {
    const onDismiss = vi.fn();
    render(<Overlay open onDismiss={onDismiss} />);
    await userEvent.click(scrim() as HTMLElement);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it("is not dismissible without onDismiss", async () => {
    render(<Overlay open />);
    expect(scrim()).not.toHaveAttribute("data-dismissible");
  });

  it("ignores clicks as a dismiss for the none variant", async () => {
    const onDismiss = vi.fn();
    render(<Overlay open variant="none" onDismiss={onDismiss} />);
    expect(scrim()).not.toHaveAttribute("data-dismissible");
    await userEvent.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("merges the consumer's className and style", () => {
    render(<Overlay open className="mine" style={{ opacity: 0.5 }} />);
    expect(scrim()).toHaveClass("mine");
    expect(scrim()).toHaveStyle({ opacity: "0.5" });
  });

  it("uses the dark tokens in dark mode", () => {
    renderInMode(<Overlay open />, "dark");
    expect(scrim()).toHaveStyle({ backgroundColor: tokens.dark.overlay.color.modal });
  });

  it("re-renders with the new mode's token when the mode changes while open", () => {
    render(<Overlay open />);
    act(() => setMode("dark"));
    expect(scrim()).toHaveStyle({ backgroundColor: tokens.dark.overlay.color.modal });
  });
});
