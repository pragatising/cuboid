import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorBlockMenu } from "./EditorBlockMenu";
import type { EditorBlockMenuProps } from "./EditorBlockMenu";

const types = [
  { label: "Basic", options: [{ value: "h1", label: "Heading 1" }, { value: "p", label: "Paragraph" }] },
  { label: "Layout", options: [{ value: "columns", label: "Columns" }] },
];

const setup = (props: Partial<EditorBlockMenuProps> = {}) => {
  const handlers = { onTransform: vi.fn(), onMoveUp: vi.fn(), onMoveDown: vi.fn(), onDelete: vi.fn(), onSelectBlock: vi.fn(), onMenuOpenChange: vi.fn() };
  render(<EditorBlockMenu types={types} current="p" {...handlers} {...props} />);
  return { user: userEvent.setup(), ...handlers };
};

describe("BlockMenu", () => {
  it("turns the block into the type chosen, with the current type checked", async () => {
    const { user, onTransform } = setup();
    await user.click(screen.getByRole("button", { name: "Turn into" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "Paragraph" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemcheckbox", { name: "Heading 1" })).toHaveAttribute("aria-checked", "false");
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Heading 1" }));
    expect(onTransform).toHaveBeenCalledWith("h1");
  });

  it("selects the block when its actions open, and reports both menus opening and closing", async () => {
    const { user, onSelectBlock, onMenuOpenChange } = setup();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(onSelectBlock).toHaveBeenCalledTimes(1);
    expect(onMenuOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard("{Escape}");
    expect(onMenuOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("moves and deletes through the actions menu", async () => {
    const { user, onMoveUp, onMoveDown, onDelete } = setup();
    for (const [name, handler] of [["Move up", onMoveUp], ["Move down", onMoveDown], ["Delete block", onDelete]] as const) {
      await user.click(screen.getByRole("button", { name: "Actions" }));
      await user.click(screen.getByRole("menuitem", { name }));
      expect(handler).toHaveBeenCalledTimes(1);
    }
  });

  it("disables a move that has nowhere to go", async () => {
    const { user } = setup({ onMoveUp: undefined });
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "Move up" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Move down" })).not.toHaveAttribute("aria-disabled", "true");
  });

  it("puts a block's own actions first", async () => {
    const { user } = setup({ actions: <button role="menuitem">Format text</button> });
    await user.click(screen.getByRole("button", { name: "Actions" }));
    const names = screen.getAllByRole("menuitem").map((item) => item.textContent);
    expect(names[0]).toBe("Format text");
  });

  it("is wide enough that a block type's name does not wrap: the panel's minimum is the portfolio's 240px, set where the popover's own minimum cannot override it", async () => {
    const { user } = setup();
    for (const name of ["Turn into", "Actions"]) {
      await user.click(screen.getByRole("button", { name }));
      const panel = screen.getByRole("menu").closest('[data-component="Popover"]') as HTMLElement;
      expect(panel.style.minWidth).toBe("240px");
      await user.keyboard("{Escape}");
    }
  });
});
