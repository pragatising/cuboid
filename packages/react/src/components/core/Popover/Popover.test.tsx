import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { expectNoAxeViolations } from "../../../test/testing";
import { Button } from "../Button";
import { Popover } from "./Popover";

const setup = (props: Partial<React.ComponentProps<typeof Popover>> = {}) =>
  render(
    <Popover trigger={<Button>Open</Button>} aria-label="Example" {...props}>
      <p>Body</p>
    </Popover>,
  );

const open = () => userEvent.click(screen.getByRole("button", { name: "Open" }));

describe("Popover", () => {
  it("renders the trigger inside an anchor wrapper, and no panel until opened", () => {
    const { container } = setup();
    expect(container.querySelector('[data-component="Popover"]')).toContainElement(screen.getByRole("button", { name: "Open" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on the trigger click into a dialog named by aria-label, in document.body", async () => {
    setup();
    await open();
    const panel = screen.getByRole("dialog", { name: "Example" });
    expect(panel.parentElement).toBe(document.body);
    expect(panel).toHaveTextContent("Body");
  });

  it("wires the trigger to the panel", async () => {
    setup();
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await open();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", screen.getByRole("dialog").id);
  });

  it("styles the panel from the popover, shadow and zIndex tokens", async () => {
    setup();
    await open();
    const panel = screen.getByRole("dialog");
    expect(panel).toHaveStyle({ backgroundColor: tokens.light.popover.color.background });
    expect(panel.style.borderRadius).toBe(tokens.light.popover.sizes.borderRadius);
    expect(panel.style.minWidth).toBe(tokens.light.popover.sizes.minWidth);
    expect(panel.style.maxWidth).toBe(tokens.light.popover.sizes.maxWidth);
    expect(panel.style.zIndex).toBe(String(tokens.light.zIndex.popover));
  });

  it("uses the md floating shadow for 3x and lg for 4x", async () => {
    const { unmount } = setup({ elevation: "3x" });
    await open();
    expect(screen.getByRole("dialog").style.boxShadow).not.toBe("");
    const md = screen.getByRole("dialog").style.boxShadow;
    unmount();
    setup({ elevation: "4x" });
    await open();
    expect(screen.getByRole("dialog").style.boxShadow).not.toBe(md);
  });

  it("closes on Escape and on an outside pointer down, not on one inside", async () => {
    setup();
    await open();
    await userEvent.click(screen.getByText("Body"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await open();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not dismiss when dismissible is false", async () => {
    setup({ dismissible: false });
    await open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("can be controlled", async () => {
    const onOpenChange = vi.fn();
    setup({ open: false, onOpenChange });
    await open();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("returns focus to the trigger on close when asked", async () => {
    setup({ returnFocusOnClose: true });
    await open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });

  it("caps the panel's height", async () => {
    setup({ maxHeight: "120px" });
    await open();
    expect(screen.getByRole("dialog").style.maxHeight).toBe("120px");
  });

  it("renders a shell without a dialog role when panelRole is false", async () => {
    setup({ panelRole: false });
    await open();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("slots", () => {
    it("renders a string header as a title that names the dialog, with a close button", async () => {
      const onClose = vi.fn();
      setup({ header: "Edit link", onClose, "aria-label": undefined });
      await open();
      expect(screen.getByRole("dialog", { name: "Edit link" })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("renders a custom header node as is", async () => {
      setup({ header: <span>Custom head</span> });
      await open();
      expect(screen.getByText("Custom head")).toBeInTheDocument();
    });

    it("renders built-in footer actions that call their handlers", async () => {
      const save = vi.fn();
      const cancel = vi.fn();
      setup({ footer: { primary: { label: "Save", onClick: save }, secondary: { label: "Cancel", onClick: cancel } } });
      await open();
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(save).toHaveBeenCalledOnce();
      expect(cancel).toHaveBeenCalledOnce();
    });

    it("renders a custom footer node as is", async () => {
      setup({ footer: <span>Custom foot</span> });
      await open();
      expect(screen.getByText("Custom foot")).toBeInTheDocument();
    });

    it("insets the body by bodyPadding when a slot is set", async () => {
      setup({ header: "Title", bodyPadding: "lg" });
      await open();
      const body = screen.getByText("Body").parentElement as HTMLElement;
      expect(body.style.paddingInline).toBe(tokens.light.space.lg);
    });
  });

  it("uses the dark tokens in dark mode", async () => {
    act(() => setMode("dark"));
    setup();
    await open();
    expect(screen.getByRole("dialog")).toHaveStyle({ backgroundColor: tokens.dark.popover.color.background });
  });

  it("has no axe violations while open", async () => {
    setup({ header: "Title", footer: { primary: { label: "Save" } } });
    await open();
    await expectNoAxeViolations(screen.getByRole("dialog"));
  });
});
