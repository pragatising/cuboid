import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, resolveVariable, themeVariables } from "../../../test/themeCss";
import { Button } from "../Button";
import { ActionMenu } from "./ActionMenu";
import itemClasses from "../ActionList/ActionListItem.module.css";
import listClasses from "../ActionList/ActionList.module.css";

behavesAsComponent({
  Component: ActionMenu.List,
  dataComponent: "ActionMenu.List",
  baseClassName: listClasses.ActionList,
  props: { children: <ActionMenu.Item>One</ActionMenu.Item> },
});
behavesAsComponent({
  Component: ActionMenu.Item,
  dataComponent: "ActionMenu.Item",
  baseClassName: itemClasses.ActionListItem,
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

  it("inlines no token variables on the list or its items: the CSS reads the published ones", () => {
    render(
      <ActionMenu.List aria-label="Things">
        <ActionMenu.Item>One</ActionMenu.Item>
      </ActionMenu.List>,
    );
    expect(screen.getByRole("menu").getAttribute("style") ?? "").not.toContain("--");
    expect(screen.getByRole("menuitem").getAttribute("style") ?? "").not.toContain("--");
  });

  it.each(["ActionList/ActionListItem", "ActionList/ActionList", "ActionMenu/ActionMenuSearch"])("%s.module.css reads only --cube-* variables the built theme.css has, in both modes", (name) => {
    const css = readSource(`src/components/core/${name}.module.css`);
    const read = cubeVariablesRead(css);
    expect(read.length).toBeGreaterThan(0);
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });

  it("resolves the item colours to the actionMenu tokens in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      const { item } = tokens[mode].actionMenu;
      expect(resolveVariable("--cube-actionMenu-item-bgColor-rest", mode)).toBe(item.bgColor.rest);
      expect(resolveVariable("--cube-actionMenu-item-bgColor-selected-pressed", mode)).toBe(item.bgColor.selected.pressed);
      expect(resolveVariable("--cube-actionMenu-item-fgColor-subtext", mode)).toBe(item.fgColor.subtext);
    }
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

  it('role="listbox" makes the items options, aria-selected on every one, with no aria-checked', () => {
    render(
      <ActionMenu.List role="listbox" aria-label="Things" selectionMode="single">
        <ActionMenu.Item selected>One</ActionMenu.Item>
        <ActionMenu.Item>Two</ActionMenu.Item>
      </ActionMenu.List>,
    );
    expect(screen.getByRole("listbox", { name: "Things" })).toBeInTheDocument();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("option", { name: "One" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Two" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("option", { name: "One" })).not.toHaveAttribute("aria-checked");
  });

  it("a listbox moves between its options with the arrow keys", async () => {
    render(
      <ActionMenu.List role="listbox" aria-label="Things">
        <ActionMenu.Item>One</ActionMenu.Item>
        <ActionMenu.Item>Two</ActionMenu.Item>
      </ActionMenu.List>,
    );
    act(() => screen.getByRole("option", { name: "One" }).focus());
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Two" })).toHaveFocus();
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

const FRUIT = ["Apple", "Banana", "Cherry"];

function Filterable({ onSelect, items = FRUIT }: { onSelect?: (item: HTMLElement) => void; items?: string[] }) {
  const [query, setQuery] = useState("");
  return (
    <ActionMenu trigger={<Button>Pick</Button>} aria-label="Fruit" defaultOpen onSelect={onSelect}>
      <ActionMenu.Search aria-label="Filter fruit" value={query} onChange={(event) => setQuery(event.target.value)} />
      {items.filter((name) => name.toLowerCase().includes(query.toLowerCase())).map((name) => (
        <ActionMenu.Item key={name}>{name}</ActionMenu.Item>
      ))}
    </ActionMenu>
  );
}

const search = () => screen.getByRole("combobox", { name: "Filter fruit" });
const option = (name: string) => screen.getByRole("option", { name });

describe("ActionMenu.Search", () => {
  it("makes the menu a listbox of options, with a combobox outside it that controls it", () => {
    render(<Filterable />);
    const list = screen.getByRole("listbox", { name: "Fruit" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(list).not.toContainElement(search());
    expect(search()).toHaveAttribute("aria-controls", list.id);
    expect(search()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Pick" })).toHaveAttribute("aria-haspopup", "listbox");
  });

  it("focuses the search field when the menu opens", () => {
    render(<Filterable />);
    expect(search()).toHaveFocus();
  });

  it("makes the first option active, and the options are not tab stops", () => {
    render(<Filterable />);
    expect(search()).toHaveAttribute("aria-activedescendant", option("Apple").id);
    expect(option("Apple")).toHaveAttribute("data-active");
    expect(option("Banana")).not.toHaveAttribute("data-active");
    expect(option("Apple")).toHaveAttribute("tabindex", "-1");
  });

  it("ArrowDown and ArrowUp move the active option and wrap, while focus stays in the field", async () => {
    render(<Filterable />);
    await userEvent.keyboard("{ArrowDown}");
    expect(search()).toHaveAttribute("aria-activedescendant", option("Banana").id);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(search()).toHaveAttribute("aria-activedescendant", option("Apple").id);
    await userEvent.keyboard("{ArrowUp}");
    expect(search()).toHaveAttribute("aria-activedescendant", option("Cherry").id);
    expect(search()).toHaveFocus();
  });

  it("skips disabled options", async () => {
    render(
      <ActionMenu trigger={<Button>Pick</Button>} aria-label="Fruit" defaultOpen>
        <ActionMenu.Search aria-label="Filter fruit" />
        <ActionMenu.Item>Apple</ActionMenu.Item>
        <ActionMenu.Item disabled>Banana</ActionMenu.Item>
        <ActionMenu.Item>Cherry</ActionMenu.Item>
      </ActionMenu>,
    );
    await userEvent.keyboard("{ArrowDown}");
    expect(search()).toHaveAttribute("aria-activedescendant", option("Cherry").id);
  });

  it("Enter chooses the active option and closes the menu", async () => {
    const onSelect = vi.fn();
    render(<Filterable onSelect={onSelect} />);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toHaveTextContent("Banana");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("filtering is the consumer's: the first matching option becomes active", async () => {
    render(<Filterable />);
    await userEvent.type(search(), "an");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(search()).toHaveAttribute("aria-activedescendant", option("Banana").id);
    expect(search()).toHaveValue("an");
  });

  it("with no matching option nothing is active and Enter does nothing", async () => {
    const onSelect = vi.fn();
    render(<Filterable onSelect={onSelect} />);
    await userEvent.type(search(), "zzz{Enter}");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(search()).not.toHaveAttribute("aria-activedescendant");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("clicking an option chooses it", async () => {
    const onSelect = vi.fn();
    render(<Filterable onSelect={onSelect} />);
    await userEvent.click(option("Cherry"));
    expect(onSelect.mock.calls[0][0]).toHaveTextContent("Cherry");
  });

  it("Escape closes the menu and returns focus to the trigger", async () => {
    render(<Filterable />);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("button", { name: "Pick" })).toHaveFocus();
  });

  it("has no axe violations", async () => {
    render(<Filterable />);
    await expectNoAxeViolations(document.querySelector('[data-component="Popover"]') as HTMLElement);
  });
});

describe("ActionMenu.Empty", () => {
  function Searchable({ items }: { items: string[] }) {
    return (
      <ActionMenu trigger={<Button>Pick</Button>} aria-label="Fruit" defaultOpen>
        <ActionMenu.Search aria-label="Filter fruit" />
        <ActionMenu.Empty role="status" heading="No results" description="Try another word" />
        {items.map((name) => (
          <ActionMenu.Item key={name}>{name}</ActionMenu.Item>
        ))}
      </ActionMenu>
    );
  }

  it("shows in place of the list while there are no items, outside the listbox", () => {
    render(<Searchable items={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("No results");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(search()).not.toHaveAttribute("aria-activedescendant");
  });

  it("keeps the list in the DOM, hidden, so the search field's aria-controls still resolves", () => {
    render(<Searchable items={[]} />);
    const id = search().getAttribute("aria-controls") as string;
    const list = document.getElementById(id);
    expect(list).toBeInTheDocument();
    expect(list).not.toBeVisible();
  });

  it("is not shown while there are items", () => {
    render(<Searchable items={["Apple"]} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    render(<Searchable items={[]} />);
    await expectNoAxeViolations(document.querySelector('[data-component="Popover"]') as HTMLElement);
  });
});

describe("ActionList CSS: hidden", () => {
  // jsdom does not load component CSS, so `toBeVisible` cannot see a display rule beating the `hidden` attribute (a real browser
  // does: a hidden list with `display: flex` stays on screen). `npm run a11y:sweep` checks it in Chrome; this guards the rule.
  it("a hidden list is display: none, so it does not take space while a loading row or an empty state shows", () => {
    const css = readSource("src/components/core/ActionList/ActionList.module.css");
    expect(css).toMatch(/\.ActionList\[hidden\]\) \{\s*display: none;/);
  });
});
