import React from "react";
import { act, render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionMenu } from "../../ActionMenu";
import { Table } from "../Table";
import { useTableColumns } from "./useTableColumns";
import type { TableColumn } from "./types";

const columns: TableColumn[] = [
  { id: "name", label: "Component" },
  { id: "owner", label: "Owner", sortable: false },
  { id: "uses", label: "Weekly uses", align: "right" },
];
const rows = [
  { name: "Button", owner: "Jane", uses: 1240 },
  { name: "Tooltip", owner: "Leslie", uses: 868 },
  { name: "Popover", owner: "Jane", uses: 640 },
];

function Demo(props: Parameters<typeof useTableColumns>[1] & { cols?: TableColumn[] }) {
  const { cols = columns, ...options } = props;
  const state = useTableColumns(cols, options);
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          {state.visible.map((column) => (
            <Table.HeadCell key={column.id} {...state.headCell(column)}>
              {column.label}
            </Table.HeadCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {state.sortRows(rows, (row, id) => row[id as keyof typeof row]).map((row) => (
          <Table.Row key={row.name}>
            {state.visible.map((column) => (
              <Table.Cell key={column.id}>{String(row[column.id as keyof typeof row])}</Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

const headers = () => screen.getAllByRole("columnheader").map((h) => h.querySelector('[data-component="Table.HeadCell.Label"]')?.textContent);
const names = () => screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0].textContent);
const choose = async (column: string, item: string) => {
  await userEvent.click(screen.getByRole("button", { name: `${column} column options` }));
  await userEvent.click(screen.getByRole("menuitem", { name: item }));
};

describe("useTableColumns: the header cells", () => {
  it("gives every column's header its menu button, named for the column", () => {
    render(<Demo />);
    expect(screen.getByRole("button", { name: "Component column options" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weekly uses column options" })).toBeInTheDocument();
  });

  it("takes the alignment from the column, and aria-sort only where the column can be sorted", () => {
    render(<Demo />);
    const [name, owner, uses] = screen.getAllByRole("columnheader");
    expect(uses).toHaveAttribute("data-align", "right");
    expect(name).toHaveAttribute("aria-sort", "none");
    expect(owner).not.toHaveAttribute("aria-sort");
  });

  it("has the standard menu: sort, then layout; and no sort for a column that cannot", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByRole("button", { name: "Owner column options" }));
    expect(screen.queryByRole("menuitem", { name: "Sort ascending" })).toBeNull();
    expect(screen.getByRole("group", { name: "Layout" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Hide column" })).toBeInTheDocument();
  });
});

describe("useTableColumns: sorting", () => {
  it("sorts the rows from the column menu, ascending, descending and clear", async () => {
    render(<Demo />);
    await choose("Weekly uses", "Sort ascending");
    expect(names()).toEqual(["Popover", "Tooltip", "Button"]);
    expect(screen.getByRole("columnheader", { name: /Weekly uses/ })).toHaveAttribute("aria-sort", "ascending");
    await choose("Weekly uses", "Sort descending");
    expect(names()).toEqual(["Button", "Tooltip", "Popover"]);
    await choose("Weekly uses", "Clear sort");
    expect(names()).toEqual(["Button", "Tooltip", "Popover"]);
    expect(screen.getByRole("columnheader", { name: /Weekly uses/ })).toHaveAttribute("aria-sort", "none");
  });

  it("sorts by one column at a time: sorting another moves the mark", async () => {
    render(<Demo />);
    await choose("Weekly uses", "Sort ascending");
    await choose("Component", "Sort ascending");
    expect(screen.getByRole("columnheader", { name: /Component/ })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("columnheader", { name: /Weekly uses/ })).toHaveAttribute("aria-sort", "none");
    expect(names()).toEqual(["Button", "Popover", "Tooltip"]);
  });

  it("can start sorted, and be controlled from outside", () => {
    const { rerender } = render(<Demo defaultSort={{ id: "uses", direction: "asc" }} />);
    expect(names()).toEqual(["Popover", "Tooltip", "Button"]);
    rerender(<Demo sort={{ id: "name", direction: "desc" }} />);
    expect(names()).toEqual(["Tooltip", "Popover", "Button"]);
  });

  it("reports a change, and a controlled sort changes only when its owner says", async () => {
    const onSortChange = vi.fn();
    render(<Demo sort={null} onSortChange={onSortChange} />);
    await choose("Weekly uses", "Sort ascending");
    expect(onSortChange).toHaveBeenCalledWith({ id: "uses", direction: "asc" });
    expect(names()).toEqual(["Button", "Tooltip", "Popover"]);
  });
});

describe("useTableColumns: layout", () => {
  it("moves a column left, right, to the end and to the start", async () => {
    render(<Demo />);
    await choose("Component", "Move right");
    expect(headers()).toEqual(["Owner", "Component", "Weekly uses"]);
    await choose("Component", "Move to end");
    expect(headers()).toEqual(["Owner", "Weekly uses", "Component"]);
    await choose("Component", "Move to beginning");
    expect(headers()).toEqual(["Component", "Owner", "Weekly uses"]);
    await choose("Weekly uses", "Move left");
    expect(headers()).toEqual(["Component", "Weekly uses", "Owner"]);
  });

  it("disables a move that goes nowhere, and does not remove it", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByRole("button", { name: "Component column options" }));
    expect(screen.getByRole("menuitem", { name: "Move left" })).toBeDisabled();
    expect(screen.getByRole("menuitem", { name: "Move to beginning" })).toBeDisabled();
    expect(screen.getByRole("menuitem", { name: "Move right" })).toBeEnabled();
  });

  it("hides a column, and the last one cannot be hidden", async () => {
    render(<Demo />);
    await choose("Owner", "Hide column");
    expect(headers()).toEqual(["Component", "Weekly uses"]);
    await choose("Weekly uses", "Hide column");
    await userEvent.click(screen.getByRole("button", { name: "Component column options" }));
    expect(screen.getByRole("menuitem", { name: "Hide column" })).toBeDisabled();
  });

  it("can leave out moving or hiding", async () => {
    render(<Demo movable={false} hideable={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Component column options" }));
    expect(screen.queryByRole("group", { name: "Layout" })).toBeNull();
    expect(screen.getByRole("menuitem", { name: "Sort ascending" })).toBeInTheDocument();
  });

  it("starts in an order, and with columns hidden", () => {
    render(<Demo defaultOrder={["uses", "name", "owner"]} defaultHidden={["owner"]} />);
    expect(headers()).toEqual(["Weekly uses", "Component"]);
  });

  it("keeps a column added after the order was made, at the end, and ignores one that is gone", () => {
    const { rerender } = render(<Demo defaultOrder={["uses", "ghost", "name"]} cols={columns.slice(0, 3)} />);
    expect(headers()).toEqual(["Weekly uses", "Component", "Owner"]);
    rerender(<Demo defaultOrder={["uses", "ghost", "name"]} cols={columns.slice(0, 2)} />);
    expect(headers()).toEqual(["Component", "Owner"]);
  });
});

describe("useTableColumns: the menu is the caller's to extend", () => {
  const withMenu: TableColumn[] = [{ id: "name", label: "Component", menu: <ActionMenu.Section label="Display"><ActionMenu.Item>Conditional color</ActionMenu.Item></ActionMenu.Section> }];

  it("adds a column's own items after the standard ones", async () => {
    render(<Demo cols={withMenu} />);
    await userEvent.click(screen.getByRole("button", { name: "Component column options" }));
    expect(screen.getByRole("group", { name: "Display" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sort ascending" })).toBeInTheDocument();
  });

  it("can leave the standard items out, so only the column's own remain", () => {
    const { result } = renderHook(() => useTableColumns(withMenu));
    const props = result.current.headCell("name", { standard: false });
    render(<div>{props.menu}</div>);
    expect(screen.getByRole("group", { name: "Display" })).toBeInTheDocument();
  });

  it("can have a menu of its own for one header", () => {
    const { result } = renderHook(() => useTableColumns(columns));
    const own = <span data-testid="own" />;
    expect(result.current.headCell("name", { menu: own }).menu).toBe(own);
  });

  it("says its words as it is told to", async () => {
    render(<Demo labels={{ sortAscending: "A to Z", options: "Opciones" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Component opciones" }));
    expect(screen.getByRole("menuitem", { name: "A to Z" })).toBeInTheDocument();
  });

  it("throws for a column it was not given", () => {
    const { result } = renderHook(() => useTableColumns(columns));
    expect(() => result.current.headCell("nope")).toThrow(/no column "nope"/);
  });
});

describe("useTableColumns: state it keeps", () => {
  it("shows hidden columns again, one at a time or all", () => {
    const { result } = renderHook(() => useTableColumns(columns, { defaultHidden: ["owner", "uses"] }));
    expect(result.current.visible.map((c) => c.id)).toEqual(["name"]);
    act(() => result.current.show("owner"));
    expect(result.current.visible.map((c) => c.id)).toEqual(["name", "owner"]);
    act(() => result.current.showAll());
    expect(result.current.visible.map((c) => c.id)).toEqual(["name", "owner", "uses"]);
  });

  it("reports order and hidden changes", () => {
    const onOrderChange = vi.fn();
    const onHiddenChange = vi.fn();
    const { result } = renderHook(() => useTableColumns(columns, { onOrderChange, onHiddenChange }));
    act(() => result.current.move("uses", "start"));
    expect(onOrderChange).toHaveBeenLastCalledWith(["uses", "name", "owner"]);
    act(() => result.current.hide("owner"));
    expect(onHiddenChange).toHaveBeenLastCalledWith(["owner"]);
  });
});
