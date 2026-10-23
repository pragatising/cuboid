import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { ActionMenu } from "../ActionMenu";
import { Sidebar, useSidebar } from "./Sidebar";
import classes from "./Sidebar.module.css";

behavesAsComponent({
  Component: Sidebar,
  dataComponent: "Sidebar",
  baseClassName: classes.Sidebar,
  props: { "aria-label": "Primary", children: "x" },
});

const nav = () => screen.getByRole("navigation", { name: "Primary" });

const shell = (props: Partial<React.ComponentProps<typeof Sidebar>> = {}, header: Partial<React.ComponentProps<typeof Sidebar.Header>> = {}) =>
  render(
    <Sidebar aria-label="Primary" {...props}>
      <Sidebar.Header leadingVisual={<i data-testid="lead" />} {...header}>John Doe</Sidebar.Header>
      <Sidebar.Body>
        <Sidebar.Section label="Primitives">
          <Sidebar.Item href="/button" current leadingVisual={<i data-testid="ico-button" />}>Button</Sidebar.Item>
          <Sidebar.Item href="/text" leadingVisual={<i />}>Text</Sidebar.Item>
        </Sidebar.Section>
      </Sidebar.Body>
      <Sidebar.Footer>Foot</Sidebar.Footer>
    </Sidebar>,
  );

describe("Sidebar", () => {
  it("is a navigation landmark holding its regions", () => {
    shell();
    expect(nav()).toHaveTextContent("John Doe");
    expect(nav()).toHaveTextContent("Button");
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

  it("hands padding, border and toggle size to the CSS as variables, and the actionMenu tokens for its rows", () => {
    shell();
    expect(nav().style.getPropertyValue("--sidebar-padding")).toBe(tokens.light.sidebar.sizes.padding);
    expect(nav().style.getPropertyValue("--sidebar-footer-padding")).toBe(tokens.light.sidebar.sizes.footerPadding);
    expect(nav().style.getPropertyValue("--sidebar-border-color")).toBe(tokens.light.sidebar.color.border);
    expect(nav().style.getPropertyValue("--sidebar-toggle-size")).toBe(tokens.light.size.control.sm.size);
    expect(nav().style.getPropertyValue("--action-menu-item-bg-color-rest")).toBe(tokens.light.actionMenu.item.bgColor.rest);
  });

  it("sits on the chosen edge", () => {
    shell({ edge: "right" });
    expect(nav()).toHaveAttribute("data-edge", "right");
  });

  it("uses the dark tokens in dark mode", () => {
    act(() => setMode("dark"));
    shell();
    expect(nav()).toHaveStyle({ backgroundColor: tokens.dark.sidebar.color.background });
    expect(nav().style.getPropertyValue("--action-menu-item-bg-color-rest")).toBe(tokens.dark.actionMenu.item.bgColor.rest);
  });

  it("has no axe violations", async () => {
    const { container } = shell();
    await expectNoAxeViolations(container);
  });
});

describe("Sidebar.Header", () => {
  it("shows the leading visual, then the title, then the toggle", () => {
    const { container } = shell();
    const header = container.querySelector('[data-component="Sidebar.Header"]') as HTMLElement;
    const order = Array.from(header.children).map((el) => (el.querySelector('[data-testid="lead"]') ? "lead" : el.getAttribute("data-component") ?? el.textContent));
    expect(order).toEqual(["lead", "Sidebar.Title", "Sidebar.Toggle"]);
  });

  it("takes any node as the leading visual", () => {
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Header leadingVisual={<svg data-testid="org-logo" />}>Acme</Sidebar.Header>
      </Sidebar>,
    );
    expect(screen.getByTestId("org-logo")).toBeInTheDocument();
  });

  it("can leave out the toggle", () => {
    shell({}, { toggle: false });
    expect(screen.queryByRole("button", { name: /sidebar/i })).not.toBeInTheDocument();
  });

  it("works with neither a leading visual nor a title", () => {
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Header />
      </Sidebar>,
    );
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
  });

  it("lets the header override its padding with spacing tokens", () => {
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Header paddingBlock="lg" paddingInline="xs" data-testid="h">Title</Sidebar.Header>
      </Sidebar>,
    );
    const header = screen.getByTestId("h");
    expect(header.style.paddingBlock).toBe(tokens.light.space.lg);
    expect(header.style.paddingInline).toBe(tokens.light.space.xs);
  });
});

describe("Sidebar collapsing", () => {
  it("starts expanded, collapses to the rail width through the header toggle, and marks itself collapsed", async () => {
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

  it("in the collapsed rail, the toggle replaces the title and leading visual", () => {
    shell({ defaultCollapsed: true });
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByTestId("lead")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });

  it("in the collapsed rail with no toggle, the leading visual stays", () => {
    shell({ defaultCollapsed: true }, { toggle: false });
    expect(screen.getByTestId("lead")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("uses Material's dock icons: dock_to_right to collapse a left sidebar, mirrored on the right", async () => {
    const { container, rerender } = shell();
    expect(container.querySelector('[data-component="Sidebar.Toggle"]')).toHaveTextContent("dock_to_right");
    rerender(
      <Sidebar aria-label="Primary" edge="right" collapsed>
        <Sidebar.Header />
      </Sidebar>,
    );
    expect(container.querySelector('[data-component="Sidebar.Toggle"]')).toHaveTextContent("dock_to_right");
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

  it("throws when a part is used outside a Sidebar", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Sidebar.Toggle />)).toThrow(/within <Sidebar>/);
    expect(() => render(<Sidebar.Item href="/x">x</Sidebar.Item>)).toThrow(/within <Sidebar>/);
    spy.mockRestore();
  });

  it("lets a custom label and icon replace the toggle's defaults", () => {
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Toggle aria-label="Dock" icon={<span data-testid="dock" />} />
      </Sidebar>,
    );
    expect(screen.getByRole("button", { name: "Dock" })).toContainElement(screen.getByTestId("dock"));
  });
});

describe("Sidebar.Section", () => {
  it("is a group named by its label, an h3, over a list of its items", () => {
    shell();
    const group = screen.getByRole("group", { name: "Primitives" });
    expect(within(group).getAllByRole("link")).toHaveLength(2);
    expect(within(group).getByRole("heading", { level: 3, name: "Primitives" })).toBeInTheDocument();
    expect(within(group).getAllByRole("listitem")).toHaveLength(2);
  });

  it("hides the label in the collapsed rail but still names the group", () => {
    shell({ defaultCollapsed: true });
    // Visually hidden, not removed: the group keeps its name and its heading.
    expect(screen.getByText("Primitives").closest('[data-component="VisuallyHidden"]')).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Primitives" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Primitives" })).toBeInTheDocument();
  });
});

describe("Sidebar.Item", () => {
  it("is a link, not a menu item", () => {
    shell();
    expect(screen.getAllByRole("link").map((a) => a.textContent)).toEqual(["Button", "Text"]);
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });

  it("marks the current page with aria-current and the selected look", () => {
    shell();
    expect(screen.getByRole("link", { name: "Button" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Button" })).toHaveAttribute("data-current");
    expect(screen.getByRole("link", { name: "Text" })).not.toHaveAttribute("aria-current");
  });

  it("goes icon-only by itself in the collapsed rail, named by its label", () => {
    shell({ defaultCollapsed: true });
    const link = screen.getByRole("link", { name: "Button" });
    expect(link).not.toHaveTextContent("Button");
    expect(link).toContainElement(screen.getByTestId("ico-button"));
    expect(link).toHaveAttribute("data-icon-only");
  });

  it("shows its name in a tooltip on hover when collapsed", async () => {
    shell({ defaultCollapsed: true });
    await userEvent.hover(screen.getByRole("link", { name: "Button" }));
    await waitFor(() => expect(document.querySelector('[data-component="Tooltip"][data-open]')).toBeInTheDocument());
    expect(document.querySelector('[data-component="Tooltip"][data-open]')).toHaveTextContent("Button");
  });

  it("keeps its label in the collapsed rail when it has no leading visual", () => {
    render(
      <Sidebar aria-label="Primary" defaultCollapsed>
        <Sidebar.Item href="/x">Plain</Sidebar.Item>
      </Sidebar>,
    );
    expect(screen.getByRole("link", { name: "Plain" })).toHaveTextContent("Plain");
  });

  it("shows the trailing visual only while expanded", () => {
    const { rerender } = render(
      <Sidebar aria-label="Primary">
        <Sidebar.Item href="/x" leadingVisual={<i />} trailingVisual={<b data-testid="trail" />}>Inbox</Sidebar.Item>
      </Sidebar>,
    );
    expect(screen.getByTestId("trail")).toBeInTheDocument();
    rerender(
      <Sidebar aria-label="Primary" collapsed>
        <Sidebar.Item href="/x" leadingVisual={<i />} trailingVisual={<b data-testid="trail" />}>Inbox</Sidebar.Item>
      </Sidebar>,
    );
    expect(screen.queryByTestId("trail")).not.toBeInTheDocument();
  });

  it("takes an explicit aria-label", () => {
    render(
      <Sidebar aria-label="Primary" defaultCollapsed>
        <Sidebar.Item href="/x" aria-label="Open settings" leadingVisual={<i />}>Settings</Sidebar.Item>
      </Sidebar>,
    );
    expect(screen.getByRole("link", { name: "Open settings" })).toBeInTheDocument();
  });

  it("renders as another element with as", async () => {
    const onClick = vi.fn();
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Item as="button" type="button" onClick={onClick}>Go</Sidebar.Item>
      </Sidebar>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("can be reached and followed by keyboard", async () => {
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Item href="/x" onClick={onClick}>Go</Sidebar.Item>
      </Sidebar>,
    );
    await userEvent.tab();
    expect(screen.getByRole("link")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("Sidebar resizing", () => {
  it("offers a resize handle only when resizable and expanded", () => {
    const { rerender } = shell();
    expect(screen.queryByRole("separator", { name: "Resize sidebar" })).not.toBeInTheDocument();
    rerender(<Sidebar aria-label="Primary" resizable>x</Sidebar>);
    expect(screen.getByRole("separator", { name: "Resize sidebar" })).toBeInTheDocument();
    rerender(<Sidebar aria-label="Primary" resizable collapsed>x</Sidebar>);
    expect(screen.queryByRole("separator", { name: "Resize sidebar" })).not.toBeInTheDocument();
  });

  const drag = (to: number) => {
    const handle = screen.getByRole("separator", { name: "Resize sidebar" });
    handle.setPointerCapture = vi.fn();
    handle.hasPointerCapture = vi.fn(() => false);
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: to, pointerId: 1 });
  };

  it("widens by the drag delta, within the token bounds, and reports it", () => {
    const onWidthChange = vi.fn();
    render(<Sidebar aria-label="Primary" resizable onWidthChange={onWidthChange}>x</Sidebar>);
    const start = parseFloat(tokens.light.sidebar.sizes.width.md) * 16;
    drag(140);
    expect(onWidthChange).toHaveBeenLastCalledWith(start + 40);
    expect(nav().style.width).toBe(`${start + 40}px`);
    fireEvent.pointerMove(screen.getByRole("separator", { name: "Resize sidebar" }), { clientX: 5000, pointerId: 1 });
    expect(nav().style.width).toBe(`${parseFloat(tokens.light.sidebar.sizes.maxWidth) * 16}px`);
  });

  it("remembers the dragged width through a collapse and expand", async () => {
    function Harness() {
      const [collapsed, setCollapsed] = useState(false);
      return (
        <>
          <button onClick={() => setCollapsed((c) => !c)}>flip</button>
          <Sidebar aria-label="Primary" resizable collapsed={collapsed}>x</Sidebar>
        </>
      );
    }
    render(<Harness />);
    const start = parseFloat(tokens.light.sidebar.sizes.width.md) * 16;
    drag(150);
    await userEvent.click(screen.getByRole("button", { name: "flip" }));
    expect(nav().style.width).toBe(tokens.light.sidebar.sizes.widthMinimized);
    await userEvent.click(screen.getByRole("button", { name: "flip" }));
    expect(nav().style.width).toBe(`${start + 50}px`);
  });

  it("starts over from the new stop when the width prop changes", () => {
    const { rerender } = render(<Sidebar aria-label="Primary" resizable>x</Sidebar>);
    drag(150);
    rerender(<Sidebar aria-label="Primary" resizable width="lg">x</Sidebar>);
    expect(nav().style.width).toBe(tokens.light.sidebar.sizes.width.lg);
  });
});

describe("Sidebar regions", () => {
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
});

describe("Sidebar.HeaderButton", () => {
  it("is a button with the label, and a chevron hidden from assistive technology", () => {
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Header>
          <Sidebar.HeaderButton leadingVisual={<svg data-testid="avatar" />}>John Doe</Sidebar.HeaderButton>
        </Sidebar.Header>
      </Sidebar>,
    );
    const button = screen.getByRole("button", { name: "John Doe" });
    expect(button).toHaveAttribute("type", "button");
    expect(within(button).getByTestId("avatar")).toBeInTheDocument();
    expect(button.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("shows no chevron with trailingVisual={false}", () => {
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Header>
          <Sidebar.HeaderButton trailingVisual={false}>John Doe</Sidebar.HeaderButton>
        </Sidebar.Header>
      </Sidebar>,
    );
    expect(screen.getByRole("button", { name: "John Doe" }).querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it("is the trigger of an ActionMenu: it opens the menu and reports it open", async () => {
    render(
      <Sidebar aria-label="Primary">
        <Sidebar.Header>
          <ActionMenu aria-label="Account" trigger={<Sidebar.HeaderButton>John Doe</Sidebar.HeaderButton>}>
            <ActionMenu.Item>Settings</ActionMenu.Item>
          </ActionMenu>
        </Sidebar.Header>
      </Sidebar>,
    );
    const button = screen.getByRole("button", { name: "John Doe" });
    expect(button).toHaveAttribute("aria-haspopup", "menu");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Settings" })).toBeInTheDocument();
  });
});
