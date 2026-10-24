import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { expectNoAxeViolations } from "../../../test/testing";
import { Button } from "../Button";
import { Popover } from "./Popover";

const panel = () => document.querySelector<HTMLElement>('[data-component="Popover"]');

const setup = (props: Partial<React.ComponentProps<typeof Popover>> = {}) =>
  render(
    <Popover trigger={<Button>Open</Button>} role="dialog" aria-label="Example" {...props}>
      <p>Body</p>
    </Popover>,
  );

const open = () => userEvent.click(screen.getByRole("button", { name: "Open" }));

describe("Popover", () => {
  it("renders only the trigger until opened: no wrapper element", () => {
    const { container } = setup();
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(screen.getByRole("button", { name: "Open" }));
    expect(panel()).toBeNull();
  });

  it("opens on the trigger click into a portaled panel", async () => {
    setup();
    await open();
    expect(panel()!.parentElement).toBe(document.body);
    expect(panel()).toHaveTextContent("Body");
  });

  it("has no role unless one is given: it is not implied to be a dialog", async () => {
    render(
      <Popover trigger={<Button>Open</Button>}>
        <p>Body</p>
      </Popover>,
    );
    await open();
    expect(panel()).not.toHaveAttribute("role");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).not.toHaveAttribute("aria-haspopup");
  });

  it("with role=dialog, is a dialog named by aria-label and the trigger says so", async () => {
    setup();
    expect(screen.getByRole("button", { name: "Open" })).toHaveAttribute("aria-haspopup", "dialog");
    await open();
    expect(screen.getByRole("dialog", { name: "Example" })).toBe(panel());
  });

  it("wires the trigger to the panel", async () => {
    setup();
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await open();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", panel()!.id);
  });

  it("styles the panel from the popover, shadow and zIndex tokens", async () => {
    setup();
    await open();
    expect(panel()).toHaveStyle({ backgroundColor: tokens.light.popover.color.background });
    expect(panel()!.style.zIndex).toBe(String(tokens.light.zIndex.popover));
  });

  it("uses the md floating shadow for 3x and lg for 4x", async () => {
    const { unmount } = setup({ elevation: "3x" });
    await open();
    const md = panel()!.style.boxShadow;
    expect(md).not.toBe("");
    unmount();
    setup({ elevation: "4x" });
    await open();
    expect(panel()!.style.boxShadow).not.toBe(md);
  });

  it("moves focus into the panel when it opens", async () => {
    render(
      <Popover trigger={<Button>Open</Button>} role="dialog" aria-label="Example">
        <Button>Inside</Button>
      </Popover>,
    );
    await open();
    expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus();
  });

  it("focuses the panel itself when nothing in it can take focus", async () => {
    setup();
    await open();
    expect(panel()).toHaveFocus();
  });

  it("keeps focus on the trigger with autoFocus off", async () => {
    setup({ autoFocus: false });
    await open();
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });

  it("closes on Escape and on an outside pointer down, not on one inside", async () => {
    setup();
    await open();
    await userEvent.click(screen.getByText("Body"));
    expect(panel()).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(panel()).toBeNull();
    await open();
    fireEvent.pointerDown(document.body);
    expect(panel()).toBeNull();
  });

  it("does not dismiss when dismissible is false", async () => {
    setup({ dismissible: false });
    await open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(panel()).toBeInTheDocument();
  });

  it("returns focus to the trigger on close, by default", async () => {
    setup();
    await open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });

  it("does not return focus with returnFocusOnClose off", async () => {
    setup({ returnFocusOnClose: false });
    await open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Open" })).not.toHaveFocus();
  });

  it("can be controlled", async () => {
    const onOpenChange = vi.fn();
    setup({ open: false, onOpenChange });
    await open();
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(panel()).toBeNull();
  });

  it("starts open with defaultOpen", () => {
    setup({ defaultOpen: true });
    expect(panel()).toBeInTheDocument();
  });

  it("caps the panel's height, and scrolls the content", async () => {
    setup({ maxHeight: "120px" });
    await open();
    expect(panel()!.style.maxHeight).toBe("120px");
  });

  it("takes CSS props and passes other attributes to the panel", async () => {
    setup({ "data-extra": "y", id: "mine" } as never);
    await open();
    expect(panel()).toHaveAttribute("data-extra", "y");
  });

  describe("parts", () => {
    it("a string Popover.Header is the title that names a dialog, with a close button", async () => {
      const onClose = vi.fn();
      render(
        <Popover trigger={<Button>Open</Button>} role="dialog">
          <Popover.Header onClose={onClose}>Edit link</Popover.Header>
          <Popover.Body>Body</Popover.Body>
        </Popover>,
      );
      await open();
      expect(screen.getByRole("dialog", { name: "Edit link" })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("renders a custom header node as it is", async () => {
      render(
        <Popover trigger={<Button>Open</Button>}>
          <Popover.Header>
            <span>Custom head</span>
          </Popover.Header>
        </Popover>,
      );
      await open();
      expect(screen.getByText("Custom head")).toBeInTheDocument();
    });

    it("lifts the header and footer around the content, whatever the order", async () => {
      render(
        <Popover trigger={<Button>Open</Button>}>
          <Popover.Footer>Foot</Popover.Footer>
          <Popover.Body>Body</Popover.Body>
          <Popover.Header>Head</Popover.Header>
        </Popover>,
      );
      await open();
      expect(Array.from(panel()!.children).map((el) => el.getAttribute("data-component"))).toEqual(["Popover.Header", "Popover.Content", "Popover.Footer"]);
    });

    it("builds a footer action row that calls its handlers", async () => {
      const save = vi.fn();
      const cancel = vi.fn();
      render(
        <Popover trigger={<Button>Open</Button>}>
          <Popover.Footer primary={{ label: "Save", onClick: save }} secondary={{ label: "Cancel", onClick: cancel }} />
        </Popover>,
      );
      await open();
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(save).toHaveBeenCalledOnce();
      expect(cancel).toHaveBeenCalledOnce();
    });

    it("takes custom footer content", async () => {
      render(
        <Popover trigger={<Button>Open</Button>}>
          <Popover.Footer>Custom foot</Popover.Footer>
        </Popover>,
      );
      await open();
      expect(screen.getByText("Custom foot")).toBeInTheDocument();
    });

    it("Popover.Body insets its content, but not its top when a header sits above", async () => {
      render(
        <Popover trigger={<Button>Open</Button>}>
          <Popover.Header>Title</Popover.Header>
          <Popover.Body>Body</Popover.Body>
        </Popover>,
      );
      await open();
      const body = screen.getByText("Body");
      expect(body.style.paddingInline).toBe(tokens.light.space.md);
      expect(body.style.paddingBlockStart === "0" || body.style.paddingBlockStart === "0px").toBe(true);
    });
  });

  it("uses the dark tokens in dark mode", async () => {
    act(() => setMode("dark"));
    setup();
    await open();
    expect(panel()).toHaveStyle({ backgroundColor: tokens.dark.popover.color.background });
  });

  it("has no axe violations while open", async () => {
    render(
      <Popover trigger={<Button>Open</Button>} role="dialog">
        <Popover.Header onClose={() => {}}>Title</Popover.Header>
        <Popover.Body>Body</Popover.Body>
        <Popover.Footer primary={{ label: "Save" }} />
      </Popover>,
    );
    await open();
    await expectNoAxeViolations(panel()!);
  });
});

describe("Popover: anchorRef", () => {
  it("renders the trigger as it is: no toggle on click, no aria-expanded, aria-controls or aria-haspopup", async () => {
    const anchor = { current: null as HTMLElement | null };
    render(
      <div>
        <div ref={(node) => void (anchor.current = node)}>anchor</div>
        <Popover trigger={<button type="button">Field</button>} anchorRef={anchor} role="listbox" aria-label="List">
          <p>Body</p>
        </Popover>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: "Field" });
    expect(trigger).not.toHaveAttribute("aria-expanded");
    expect(trigger).not.toHaveAttribute("aria-controls");
    expect(trigger).not.toHaveAttribute("aria-haspopup");
    await userEvent.click(trigger);
    expect(panel()).toBeNull();
  });

  it("opens from the open prop and is dismissed by a press outside it and its anchor", async () => {
    const onOpenChange = vi.fn();
    const anchor = { current: null as HTMLElement | null };
    render(
      <div>
        <div ref={(node) => void (anchor.current = node)}>anchor</div>
        <button type="button">outside</button>
        <Popover trigger={<button type="button">Field</button>} anchorRef={anchor} open onOpenChange={onOpenChange} aria-label="List">
          <p>Body</p>
        </Popover>
      </div>,
    );
    expect(panel()).toBeInTheDocument();
    await userEvent.click(screen.getByText("anchor"));
    expect(onOpenChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "outside" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
