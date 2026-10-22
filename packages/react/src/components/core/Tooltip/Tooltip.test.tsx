import { useContext } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlatformProvider } from "../../../behaviors";
import { expectNoAxeViolations } from "../../../test/testing";
import { Tooltip } from "./Tooltip";
import { TooltipContext } from "./TooltipContext";

const panel = () => document.querySelector<HTMLElement>('[data-component="Tooltip"]');
const isOpen = () => panel()?.hasAttribute("data-open") ?? false;

const setup = (props: Partial<React.ComponentProps<typeof Tooltip>> = {}) =>
  render(
    <Tooltip text="Hint" {...props}>
      <button type="button">Anchor</button>
    </Tooltip>,
  );

afterEach(() => vi.restoreAllMocks());

describe("Tooltip", () => {
  it("renders no wrapper: the trigger is the only element in place", () => {
    const { container } = setup();
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild).toBe(screen.getByRole("button"));
  });

  it("is closed until hovered, then opens after the delay", async () => {
    setup();
    expect(isOpen()).toBe(false);
    await userEvent.hover(screen.getByRole("button"));
    await waitFor(() => expect(isOpen()).toBe(true));
    expect(panel()).toHaveTextContent("Hint");
  });

  it("a `long` delay does not open at once", async () => {
    setup({ delay: "long" });
    await userEvent.hover(screen.getByRole("button"));
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(isOpen()).toBe(false);
  });

  it("opens at once on keyboard focus and closes on blur", async () => {
    setup();
    await userEvent.tab();
    expect(isOpen()).toBe(true);
    await userEvent.tab();
    expect(isOpen()).toBe(false);
  });

  it("closes on Escape", async () => {
    setup();
    await userEvent.tab();
    await userEvent.keyboard("{Escape}");
    expect(isOpen()).toBe(false);
  });

  it("stays open while the pointer is on the tooltip itself", async () => {
    setup();
    const button = screen.getByRole("button");
    await userEvent.hover(button);
    await waitFor(() => expect(isOpen()).toBe(true));
    await userEvent.unhover(button);
    fireEvent.mouseEnter(panel()!);
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(isOpen()).toBe(true);
    fireEvent.mouseLeave(panel()!);
    expect(isOpen()).toBe(false);
  });

  it("closes shortly after the pointer leaves the trigger", async () => {
    setup();
    const button = screen.getByRole("button");
    await userEvent.hover(button);
    await waitFor(() => expect(isOpen()).toBe(true));
    await userEvent.unhover(button);
    await waitFor(() => expect(isOpen()).toBe(false));
  });

  it("does not open while suppressed", async () => {
    setup({ suppress: true });
    await userEvent.tab();
    await userEvent.hover(screen.getByRole("button"));
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(isOpen()).toBe(false);
  });

  it("description: describes the trigger, keeping existing descriptions, and is a tooltip", () => {
    render(
      <>
        <span id="other">Other</span>
        <Tooltip text="Hint">
          <button type="button" aria-describedby="other">Anchor</button>
        </Tooltip>
      </>,
    );
    expect(screen.getByRole("button")).toHaveAccessibleDescription("Other Hint");
    expect(panel()).toHaveAttribute("role", "tooltip");
    expect(panel()).toHaveAttribute("aria-hidden", "true");
  });

  it("label: names the trigger and is not a tooltip role", () => {
    render(
      <Tooltip text="Settings" type="label">
        <button type="button">
          <svg aria-hidden />
        </button>
      </Tooltip>,
    );
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(panel()).not.toHaveAttribute("role");
  });

  it("composes the trigger's own handlers and ref", async () => {
    const onMouseEnter = vi.fn();
    const ref = vi.fn();
    render(
      <Tooltip text="Hint">
        <button type="button" onMouseEnter={onMouseEnter} ref={ref}>Anchor</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole("button"));
    expect(onMouseEnter).toHaveBeenCalled();
    expect(ref).toHaveBeenCalledWith(screen.getByRole("button"));
  });

  it("forwards its own ref to the trigger", () => {
    const ref = { current: null as HTMLElement | null };
    render(
      <Tooltip text="Hint" ref={ref}>
        <button type="button">Anchor</button>
      </Tooltip>,
    );
    expect(ref.current).toBe(screen.getByRole("button"));
  });

  it("renders in a portal on the body", () => {
    const { container } = setup();
    expect(container).not.toContainElement(panel());
    expect(panel()!.parentElement).toBe(document.body);
  });

  it("shows keybinding hints, and speaks them in words once", () => {
    render(
      <PlatformProvider value="apple">
        <Tooltip text="Save" keybindingHint="Mod+S">
          <button type="button">Anchor</button>
        </Tooltip>
      </PlatformProvider>,
    );
    expect(panel()!.querySelector("kbd")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAccessibleDescription(/Save\s*\(command s\)/i);
  });

  it("tells what is inside the trigger that it is in a tooltip", () => {
    let seen: string | undefined;
    const Probe = () => {
      seen = useContext(TooltipContext).tooltipId;
      return <span>probe</span>;
    };
    render(
      <Tooltip text="Hint">
        <button type="button"><Probe /></button>
      </Tooltip>,
    );
    expect(seen).toBeTruthy();
  });

  it("warns about a trigger that cannot take focus", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Tooltip text="Hint">
        <span>Anchor</span>
      </Tooltip>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("cannot take keyboard focus"));
  });

  it("has no axe violations", async () => {
    const { container } = setup();
    await act(async () => {});
    await expectNoAxeViolations(container);
  });
});
