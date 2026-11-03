import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import { expectNoAxeViolations } from "../../../test/testing";
import { SimpleTable } from "./SimpleTable";

type Row = { name: string; age: number };
const data: Row[] = [
  { name: "Cara", age: 30 },
  { name: "Abe", age: 50 },
  { name: "Bea", age: 40 },
];
const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: "name", header: "Name", meta: { width: "40%" } },
  { accessorKey: "age", header: "Age", meta: { align: "right" } },
];

const names = () => screen.getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("SimpleTable", () => {
  it("renders a header row and a row per datum", () => {
    render(<SimpleTable columns={columns} data={data} />);
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Name", "Age"]);
    expect(names()).toEqual(["Cara", "Abe", "Bea"]);
  });

  it("sizes columns from meta.width and aligns cells from meta.align", () => {
    const { container } = render(<SimpleTable columns={columns} data={data} />);
    expect((container.querySelector("col") as HTMLElement).style.width).toBe("40%");
    expect(screen.getByRole("cell", { name: "30" })).toHaveAttribute("data-align", "right");
  });

  it("truncates cells as a Table does by default, wraps them with rowLayout, and takes a per-column rowLayout", () => {
    const { rerender } = render(<SimpleTable columns={columns} data={data} />);
    expect(screen.getByRole("cell", { name: "30" })).toHaveAttribute("data-row-layout", "truncate");
    rerender(<SimpleTable columns={columns} data={data} rowLayout="wrap" />);
    expect(screen.getByRole("cell", { name: "30" })).toHaveAttribute("data-row-layout", "wrap");
    rerender(<SimpleTable columns={columns} data={data} rowLayout="truncate" />);
    expect(screen.getByRole("cell", { name: "30" })).toHaveAttribute("data-row-layout", "truncate");
    rerender(
      <SimpleTable rowLayout="truncate"
        columns={[{ accessorKey: "name", header: "Name", meta: { rowLayout: "wrap" } }, { accessorKey: "age", header: "Age" }]}
        data={data}
      />,
    );
    expect(screen.getByRole("cell", { name: "Cara" })).toHaveAttribute("data-row-layout", "wrap");
    expect(screen.getByRole("cell", { name: "30" })).toHaveAttribute("data-row-layout", "truncate");
  });

  it("has plain headers when sorting is off", () => {
    render(<SimpleTable columns={columns} data={data} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")[0]).not.toHaveAttribute("aria-sort");
  });

  it("sorts from the column menu, ascending then descending, and clears", async () => {
    render(<SimpleTable columns={columns} data={data} enableSorting />);
    const header = () => screen.getByRole("columnheader", { name: /name/i });
    expect(header()).toHaveAttribute("aria-sort", "none");

    await userEvent.click(screen.getByRole("button", { name: "name column options" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Sort ascending" }));
    expect(names()).toEqual(["Abe", "Bea", "Cara"]);
    expect(header()).toHaveAttribute("aria-sort", "ascending");

    await userEvent.click(screen.getByRole("button", { name: "name column options" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Sort descending" }));
    expect(names()).toEqual(["Cara", "Bea", "Abe"]);
    expect(header()).toHaveAttribute("aria-sort", "descending");

    await userEvent.click(screen.getByRole("button", { name: "name column options" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Clear sort" }));
    expect(names()).toEqual(["Cara", "Abe", "Bea"]);
    expect(header()).toHaveAttribute("aria-sort", "none");
  });

  it("offers no clear-sort while the column is not sorted", async () => {
    render(<SimpleTable columns={columns} data={data} enableSorting />);
    await userEvent.click(screen.getByRole("button", { name: "name column options" }));
    expect(screen.queryByRole("menuitem", { name: "Clear sort" })).toBeNull();
  });

  it("can be sorted from outside with controlled state", async () => {
    render(<SimpleTable columns={columns} data={data} enableSorting sorting={[{ id: "age", desc: true }]} />);
    expect(names()).toEqual(["Abe", "Bea", "Cara"]);
  });

  it("uses getRowId for row identity", () => {
    render(<SimpleTable columns={columns} data={data} getRowId={(row) => row.name} />);
    expect(names()).toHaveLength(3);
  });

  it("has no axe violations", async () => {
    const { container } = render(<SimpleTable columns={columns} data={data} enableSorting />);
    await expectNoAxeViolations(container);
  });
});
