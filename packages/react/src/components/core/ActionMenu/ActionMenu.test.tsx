import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { Button } from "../Button";
import { ActionMenu } from "./ActionMenu";
import { ActionMenuItem } from "./ActionMenuItem";
import { ActionMenuList } from "./ActionMenuList";
import itemClasses from "./ActionMenuItem.module.css";
import listClasses from "./ActionMenuList.module.css";

behavesAsComponent({
  Component: ActionMenuList,
  dataComponent: "ActionMenuList",
  baseClassName: listClasses.ActionMenuList,
  props: { children: <ActionMenuItem>One</ActionMenuItem> },
});
behavesAsComponent({
  Component: ActionMenuItem,
  dataComponent: "ActionMenuItem",
  baseClassName: itemClasses.ActionMenuItem,
  props: { children: "One" },
});

const menu = (props: Partial<React.ComponentProps<typeof ActionMenu>> = {}) =>
  render(
    <ActionMenu trigger={<Button>Actions</Button>} aria-label="Actions" {...props}>
      <ActionMenuItem>Edit</ActionMenuItem>
      <ActionMenuItem>Duplicate</ActionMenuItem>
      <ActionMenuItem disabled>Delete</ActionMenuItem>
    </ActionMenu>,
  );

describe("ActionMenuList and ActionMenuItem", () => {
  it("is a menu of menuitems", () => {
    render(
      <ActionMenuList aria-label="Things">
        <ActionMenuItem>One</ActionMenuItem>
        <ActionMenuItem>Two</ActionMenuItem>
      </ActionMenuList>,
    );
    expect(screen.getByRole("menu", { name: "Things" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
  });

  it("hands the actionMenu tokens down as scoped variables", () => {
    render(
      <ActionMenuList aria-label="Things">
        <ActionMenuItem>One</ActionMenuItem>
      </ActionMenuList>,
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
      <ActionMenuList aria-label="Things">
        <ActionMenuItem>One</ActionMenuItem>
      </ActionMenuList>,
    );
    act(() => setMode("dark"));
    expect(screen.getByRole("menu").style.getPropertyValue("--action-menu-item-bg-color-rest")).toBe(
      tokens.dark.actionMenu.item.bgColor.rest,
    );
  });

  it("lifts the header and footer around the items", () => {
    render(
      <ActionMenuList aria-label="Things">
        <ActionMenuItem>One</ActionMenuItem>
        <ActionMenuList.Footer>Foot</ActionMenuList.Footer>
        <ActionMenuList.Header>Head</ActionMenuList.Header>
      </ActionMenuList>,
    );
    const order = Array.from(screen.getByRole("menu").children).map((el) => el.getAttribute("data-component") ?? "items");
    expect(order).toEqual(["ActionMenuList.Header", "items", "ActionMenuList.Footer"]);
  });

  it("groups a section under its label", () => {
    render(
      <ActionMenuList aria-label="Things">
        <ActionMenuList.Section label="Section one">
          <ActionMenuItem>One</ActionMenuItem>
        </ActionMenuList.Section>
      </ActionMenuList>,
    );
    expect(screen.getByRole("group", { name: "Section one" })).toBeInTheDocument();
  });

  it("marks the selected item and shows a check", () => {
    const { container } = render(
      <ActionMenuList aria-label="Things">
        <ActionMenuItem selected>One</ActionMenuItem>
      </ActionMenuList>,
    );
    expect(screen.getByRole("menuitem")).toHaveAttribute("aria-checked", "true");
    expect(container.textContent).toContain("check");
  });

  it("names an icon-only item from its string children", () => {
    render(
      <ActionMenuList aria-label="Things">
        <ActionMenuItem iconOnly leadingIcon={<svg />}>Home</ActionMenuItem>
      </ActionMenuList>,
    );
    expect(screen.getByRole("menuitem", { name: "Home" })).toBeInTheDocument();
  });

  it("disables natively and by aria", () => {
    render(
      <ActionMenuList aria-label="Things">
        <ActionMenuItem disabled>One</ActionMenuItem>
      </ActionMenuList>,
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
        <ActionMenuItem onClick={onEdit}>Edit</ActionMenuItem>
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
        <ActionMenuItem keepOpenOnSelect>Edit</ActionMenuItem>
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
