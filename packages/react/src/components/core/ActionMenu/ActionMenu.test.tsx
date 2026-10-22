import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { Button } from "../Button";
import { ActionMenu } from "./ActionMenu";
import itemClasses from "./ActionMenuItem.module.css";
import listClasses from "./ActionMenuList.module.css";

behavesAsComponent({
  Component: ActionMenu.List,
  dataComponent: "ActionMenu.List",
  baseClassName: listClasses.ActionMenuList,
  props: { children: <ActionMenu.Item>One</ActionMenu.Item> },
});
behavesAsComponent({
  Component: ActionMenu.Item,
  dataComponent: "ActionMenu.Item",
  baseClassName: itemClasses.ActionMenuItem,
  props: { children: "One" },
});

const menu = (props: Partial<React.ComponentProps<typeof ActionMenu>> = {}) =>
  render(
    <ActionMenu trigger={<Button>Actions</Button>} aria-label="Actions" {...props}>
      <ActionMenu.Item>Edit</ActionMenu.Item>
      <ActionMenu.Item>Duplicate</ActionMenu.Item>
      <ActionMenu.Item disabled>Delete</ActionMenu.Item>
    </ActionMenu>,
  );

describe("ActionMenu.List and ActionMenu.Item", () => {
  it("is a menu of menuitems", () => {
    render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Item>One</ActionMenu.Item>
        <ActionMenu.Item>Two</ActionMenu.Item>
      </ActionMenu.List>,
    );
    expect(screen.getByRole("menu", { name: "Things" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
  });

  it("hands the actionMenu tokens down as scoped variables", () => {
    render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Item>One</ActionMenu.Item>
      </ActionMenu.List>,
    );
    const list = screen.getByRole("menu");
    expect(list.style.getPropertyValue("--action-menu-item-bg-color-rest")).toBe(tokens.light.actionMenu.item.bgColor.rest);
    expect(list.style.getPropertyValue("--action-menu-item-bg-color-selected-pressed")).toBe(
      tokens.light.actionMenu.item.bgColor.selected.pressed,
    );
    expect(list.style.getPropertyValue("--action-menu-sizes-item-min-height")).toBe(tokens.light.actionMenu.sizes.item.minHeight);
  });

  it("re-renders its variables with the new mode's tokens", () => {
    render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Item>One</ActionMenu.Item>
      </ActionMenu.List>,
    );
    act(() => setMode("dark"));
    expect(screen.getByRole("menu").style.getPropertyValue("--action-menu-item-bg-color-rest")).toBe(
      tokens.dark.actionMenu.item.bgColor.rest,
    );
  });

  it("keeps the header and footer outside the menu, around the items", async () => {
    render(
      <ActionMenu trigger={<Button>Actions</Button>} aria-label="Things" defaultOpen>
        <ActionMenu.Footer>Foot</ActionMenu.Footer>
        <ActionMenu.Item>One</ActionMenu.Item>
        <ActionMenu.Header>Head</ActionMenu.Header>
      </ActionMenu>,
    );
    const panel = screen.getByRole("menu").parentElement!.parentElement!;
    expect(Array.from(panel.children).map((el) => el.getAttribute("data-component"))).toEqual(["Popover.Header", "Popover.Content", "Popover.Footer"]);
    expect(screen.getByRole("menu")).not.toHaveTextContent("Head");
  });

  it("groups a section under its label", () => {
    render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Section label="Section one">
          <ActionMenu.Item>One</ActionMenu.Item>
        </ActionMenu.Section>
      </ActionMenu.List>,
    );
    expect(screen.getByRole("group", { name: "Section one" })).toBeInTheDocument();
  });

  it("a plain item is a menuitem with no checked state", () => {
    render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Item>One</ActionMenu.Item>
      </ActionMenu.List>,
    );
    expect(screen.getByRole("menuitem")).not.toHaveAttribute("aria-checked");
  });

  it("an item with `selected` is a checkbox, checked or not, and shows a check when selected", () => {
    const { container } = render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Item selected>One</ActionMenu.Item>
        <ActionMenu.Item selected={false}>Two</ActionMenu.Item>
      </ActionMenu.List>,
    );
    expect(screen.getByRole("menuitemcheckbox", { name: "One" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemcheckbox", { name: "Two" })).toHaveAttribute("aria-checked", "false");
    expect(container.textContent).toContain("check");
  });

  it("selectionMode=single makes the items radios, multiple makes them checkboxes", () => {
    const { rerender } = render(
      <ActionMenu.List aria-label="Things" selectionMode="single">
        <ActionMenu.Item selected>One</ActionMenu.Item>
        <ActionMenu.Item>Two</ActionMenu.Item>
      </ActionMenu.List>,
    );
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(2);
    expect(screen.getByRole("menuitemradio", { name: "Two" })).toHaveAttribute("aria-checked", "false");
    rerender(
      <ActionMenu.List aria-label="Things" selectionMode="multiple">
        <ActionMenu.Item>One</ActionMenu.Item>
      </ActionMenu.List>,
    );
    expect(screen.getByRole("menu")).toHaveAttribute("aria-multiselectable", "true");
    expect(screen.getAllByRole("menuitemcheckbox")).toHaveLength(1);
  });

  it("renders leading and trailing visuals hidden from assistive technology, and a description", () => {
    render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Item leadingVisual={<svg data-testid="lead" />} trailingVisual={<svg data-testid="trail" />} description="Supporting">
          One
        </ActionMenu.Item>
      </ActionMenu.List>,
    );
    expect(screen.getByTestId("lead")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("trail")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("menuitem")).toHaveTextContent("Supporting");
  });

  it("moves between its items with the arrow keys on its own", async () => {
    render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Item>One</ActionMenu.Item>
        <ActionMenu.Item>Two</ActionMenu.Item>
      </ActionMenu.List>,
    );
    act(() => screen.getByRole("menuitem", { name: "One" }).focus());
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Two" })).toHaveFocus();
    await userEvent.keyboard("t");
    expect(screen.getByRole("menuitem", { name: "Two" })).toHaveFocus();
  });

  it("names an icon-only item from its string children", () => {
    render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Item iconOnly leadingVisual={<svg />}>Home</ActionMenu.Item>
      </ActionMenu.List>,
    );
    expect(screen.getByRole("menuitem", { name: "Home" })).toBeInTheDocument();
  });

  it("disables natively and by aria", () => {
    render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Item disabled>One</ActionMenu.Item>
      </ActionMenu.List>,
    );
    expect(screen.getByRole("menuitem")).toBeDisabled();
    expect(screen.getByRole("menuitem")).toHaveAttribute("aria-disabled", "true");
  });
});

describe("ActionMenu", () => {
  it("opens from the trigger and shows the menu in the popover", async () => {
    menu();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu", { name: "Actions" })).toBeInTheDocument();
  });

  it("opens with ArrowDown on the trigger and focuses the first item", async () => {
    menu();
    act(() => screen.getByRole("button", { name: "Actions" }).focus());
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
  });

  it("moves between enabled items with the arrow keys", async () => {
    menu();
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
  });

  it("closes after an item is chosen and runs its handler", async () => {
    const onEdit = vi.fn();
    render(
      <ActionMenu trigger={<Button>Actions</Button>} aria-label="Actions">
        <ActionMenu.Item onClick={onEdit}>Edit</ActionMenu.Item>
      </ActionMenu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("stays open for an item with keepOpenOnSelect", async () => {
    render(
      <ActionMenu trigger={<Button>Actions</Button>} aria-label="Actions">
        <ActionMenu.Item keepOpenOnSelect>Edit</ActionMenu.Item>
      </ActionMenu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    menu();
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();
  });

  it("can be controlled", async () => {
    const onOpenChange = vi.fn();
    menu({ open: false, onOpenChange });
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("focuses the selected item when it opens", async () => {
    render(
      <ActionMenu trigger={<Button>Actions</Button>} aria-label="Actions" selectionMode="single">
        <ActionMenu.Item>One</ActionMenu.Item>
        <ActionMenu.Item selected>Two</ActionMenu.Item>
      </ActionMenu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitemradio", { name: "Two" })).toHaveFocus();
  });

  it("keeps focus on the trigger with autoFocusFirstItem off", async () => {
    menu({ autoFocusFirstItem: false });
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();
  });

  it("calls onSelect with the activated item", async () => {
    const onSelect = vi.fn();
    menu({ onSelect });
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onSelect).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it("Tab closes the menu with focus on the trigger, so Tab carries on from there", async () => {
    menu();
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "Edit" }), { key: "Tab" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();
  });

  it("marks the trigger as a menu popup", () => {
    menu();
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute("aria-haspopup", "menu");
  });

  it("has no axe violations while open", async () => {
    menu();
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await expectNoAxeViolations(screen.getByRole("menu"));
  });
});
