import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { Sidebar, useSidebar } from "./Sidebar";
import classes from "./Sidebar.module.css";

behavesAsComponent({
  Component: Sidebar,
  dataComponent: "Sidebar",
  baseClassName: classes.Sidebar,
  props: { "aria-label": "Primary", children: "x" },
});

const nav = () => screen.getByRole("navigation", { name: "Primary" });

const shell = (props: Partial<React.ComponentProps<typeof Sidebar>> = {}, withToggle = true) =>
  render(
    <Sidebar aria-label="Primary" {...props}>
      <Sidebar.Header>{withToggle && <Sidebar.Toggle />}Head</Sidebar.Header>
      <Sidebar.Body>Body</Sidebar.Body>
      <Sidebar.Footer>Foot</Sidebar.Footer>
    </Sidebar>,
  );

describe("Sidebar", () => {
  it("is a navigation landmark holding its regions", () => {
    shell();
    expect(nav()).toHaveTextContent("Head");
    expect(nav()).toHaveTextContent("Body");
    expect(nav()).toHaveTextContent("Foot");
  });

  it("takes background and the md width from the sidebar tokens", () => {
    shell();
    expect(nav()).toHaveStyle({ backgroundColor: tokens.light.sidebar.color.background });
    expect(nav().style.width).toBe(tokens.light.sidebar.sizes.width.md);
    expect(nav().style.maxWidth).toBe(tokens.light.sidebar.sizes.maxWidth);
  });

  it.each(["sm", "lg"] as const)("takes the %s width stop", (stop) => {
    shell({ width: stop });
    expect(nav().style.width).toBe(tokens.light.sidebar.sizes.width[stop]);
  });

  it("hands padding, border and toggle size to the CSS as variables", () => {
    shell();
    expect(nav().style.getPropertyValue("--sidebar-padding")).toBe(tokens.light.sidebar.sizes.padding);
    expect(nav().style.getPropertyValue("--sidebar-footer-padding")).toBe(tokens.light.sidebar.sizes.footerPadding);
    expect(nav().style.getPropertyValue("--sidebar-border-color")).toBe(tokens.light.sidebar.color.border);
    expect(nav().style.getPropertyValue("--sidebar-toggle-size")).toBe(tokens.light.size.control.sm.size);
  });

  it("sits on the chosen edge", () => {
    shell({ edge: "right" });
    expect(nav()).toHaveAttribute("data-edge", "right");
  });

  describe("collapsing", () => {
    it("starts expanded, collapses to the rail width, and marks itself collapsed", async () => {
      shell();
      expect(nav()).not.toHaveAttribute("data-collapsed");
      await userEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      expect(nav()).toHaveAttribute("data-collapsed", "true");
      expect(nav().style.width).toBe(tokens.light.sidebar.sizes.widthMinimized);
      expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
    });

    it("can start collapsed", () => {
      shell({ defaultCollapsed: true });
      expect(nav()).toHaveAttribute("data-collapsed", "true");
    });

    it("is controllable", async () => {
      const onCollapsedChange = vi.fn();
      shell({ collapsed: false, onCollapsedChange });
      await userEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
      expect(nav()).not.toHaveAttribute("data-collapsed");
    });

    it("shares its state with useSidebar", async () => {
      function Probe() {
        const { collapsed, toggleCollapsed } = useSidebar();
        return <button onClick={toggleCollapsed}>{collapsed ? "collapsed" : "expanded"}</button>;
      }
      render(
        <Sidebar aria-label="Primary">
          <Probe />
        </Sidebar>,
      );
      await userEvent.click(screen.getByRole("button", { name: "expanded" }));
      expect(screen.getByRole("button", { name: "collapsed" })).toBeInTheDocument();
    });

    it("throws when the toggle is used outside a Sidebar", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<Sidebar.Toggle />)).toThrow(/within <Sidebar>/);
      spy.mockRestore();
    });

    it("lets a custom label and icon replace the defaults", () => {
      render(
        <Sidebar aria-label="Primary">
          <Sidebar.Toggle aria-label="Dock"><span data-testid="dock" /></Sidebar.Toggle>
        </Sidebar>,
      );
      expect(screen.getByRole("button", { name: "Dock" })).toContainElement(screen.getByTestId("dock"));
    });
  });

  describe("resizing", () => {
    it("offers a resize handle only when resizable and expanded", () => {
      const { rerender } = shell();
      expect(screen.queryByRole("button", { name: "Resize sidebar" })).not.toBeInTheDocument();
      rerender(
        <Sidebar aria-label="Primary" resizable>
          x
        </Sidebar>,
      );
      expect(screen.getByRole("button", { name: "Resize sidebar" })).toBeInTheDocument();
      rerender(
        <Sidebar aria-label="Primary" resizable collapsed>
          x
        </Sidebar>,
      );
      expect(screen.queryByRole("button", { name: "Resize sidebar" })).not.toBeInTheDocument();
    });

    it("widens by the drag delta, within the token bounds, and reports it", () => {
      const onWidthChange = vi.fn();
      render(
        <Sidebar aria-label="Primary" resizable onWidthChange={onWidthChange}>
          x
        </Sidebar>,
      );
      const handle = screen.getByRole("button", { name: "Resize sidebar" });
      handle.setPointerCapture = vi.fn();
      handle.hasPointerCapture = vi.fn(() => false);
      const start = parseFloat(tokens.light.sidebar.sizes.width.md) * 16;
      fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientX: 140, pointerId: 1 });
      expect(onWidthChange).toHaveBeenLastCalledWith(start + 40);
      expect(nav().style.width).toBe(`${start + 40}px`);
      fireEvent.pointerMove(handle, { clientX: 5000, pointerId: 1 });
      expect(nav().style.width).toBe(`${parseFloat(tokens.light.sidebar.sizes.maxWidth) * 16}px`);
    });
  });

  it("lets a region override its padding with spacing tokens", () => {
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Body paddingBlock="lg" paddingInline="xs">Body</Sidebar.Body>
      </Sidebar>,
    );
    const body = screen.getByText("Body");
    expect(body.style.paddingBlock).toBe(tokens.light.space.lg);
    expect(body.style.paddingInline).toBe(tokens.light.space.xs);
  });

  it("marks a floating toggle with its alignment", () => {
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Toggle floating floatingAlign="corner" data-testid="t" />
      </Sidebar>,
    );
    expect(screen.getByTestId("t")).toHaveAttribute("data-floating", "corner");
  });

  it("uses the dark tokens in dark mode", () => {
    act(() => setMode("dark"));
    shell();
    expect(nav()).toHaveStyle({ backgroundColor: tokens.dark.sidebar.color.background });
  });

  it("has no axe violations", async () => {
    const { container } = shell();
    await expectNoAxeViolations(container);
  });
});
