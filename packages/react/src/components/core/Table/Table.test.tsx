import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { SimpleTable, Table } from "./Table";
import classes from "./Table.module.css";

behavesAsComponent({ Component: Table.Root, dataComponent: "Table.Root", baseClassName: classes.TableRoot });
behavesAsComponent({ Component: Table, dataComponent: "Table", baseClassName: classes.Table });

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

describe("Table parts", () => {
  it("compose into a real table", () => {
    render(
      <Table.Root>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeadCell>Shape</Table.HeadCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Sphere</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Table.Root>,
    );
    expect(screen.getByRole("columnheader", { name: "Shape" })).toHaveAttribute("scope", "col");
    expect(screen.getByRole("cell", { name: "Sphere" })).toBeInTheDocument();
  });

  it("hands the spacious token set to the CSS by default, and the dense set when dense", () => {
    const { container, rerender } = render(<Table.Root />);
    const root = () => container.querySelector('[data-component="Table.Root"]') as HTMLElement;
    const spacious = tokens.light.table.sizes.density.spacious;
    expect(root().style.getPropertyValue("--table-row-height")).toBe(spacious.rowHeight);
    expect(root().style.getPropertyValue("--table-cell-padding-inline")).toBe(spacious.cellPaddingInline);
    rerender(<Table.Root density="dense" />);
    const dense = tokens.light.table.sizes.density.dense;
    expect(root().style.getPropertyValue("--table-row-height")).toBe(dense.rowHeight);
    expect(root().style.getPropertyValue("--table-cell-padding-block")).toBe(dense.cellPaddingBlock);
  });

  it("hands colours, radius and border width to the CSS as variables", () => {
    const { container } = render(<Table.Root />);
    const root = container.querySelector('[data-component="Table.Root"]') as HTMLElement;
    const t = tokens.light.table;
    expect(root.style.getPropertyValue("--table-header-bg")).toBe(t.color.header.bgColor);
    expect(root.style.getPropertyValue("--table-body-fg")).toBe(t.color.body.fgColor);
    expect(root.style.getPropertyValue("--table-container-border")).toBe(t.color.container.borderColor);
    expect(root.style.getPropertyValue("--table-border-radius")).toBe(t.sizes.borderRadius);
    expect(root.style.getPropertyValue("--table-border-width")).toBe(tokens.light.borderWidth.thin);
  });

  it("marks the lines style, grid by default", () => {
    const { container, rerender } = render(<Table.Root />);
    const root = () => container.querySelector('[data-component="Table.Root"]') as HTMLElement;
    expect(root()).toHaveAttribute("data-lines", "grid");
    rerender(<Table.Root lines="none" />);
    expect(root()).toHaveAttribute("data-lines", "none");
  });

  it("marks a cell's alignment and row layout (wrap by default)", () => {
    render(
      <table>
        <tbody>
          <tr>
            <Table.Cell align="right">a</Table.Cell>
            <Table.Cell rowLayout="truncate">b</Table.Cell>
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getByRole("cell", { name: "a" })).toHaveAttribute("data-align", "right");
    expect(screen.getByRole("cell", { name: "a" })).toHaveAttribute("data-row-layout", "wrap");
    expect(screen.getByRole("cell", { name: "b" })).toHaveAttribute("data-row-layout", "truncate");
  });

  it("re-renders with the new mode's tokens when the mode changes while mounted", () => {
    const { container } = render(<Table.Root />);
    act(() => setMode("dark"));
    const root = container.querySelector('[data-component="Table.Root"]') as HTMLElement;
    expect(root.style.getPropertyValue("--table-header-bg")).toBe(tokens.dark.table.color.header.bgColor);
  });
});

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

  it("truncates cells by default and takes a per-column rowLayout", () => {
    render(
      <SimpleTable
        columns={[{ accessorKey: "name", header: "Name", meta: { rowLayout: "wrap" } }, { accessorKey: "age", header: "Age" }]}
        data={data}
      />,
    );
    expect(screen.getByRole("cell", { name: "Cara" })).toHaveAttribute("data-row-layout", "wrap");
    expect(screen.getByRole("cell", { name: "30" })).toHaveAttribute("data-row-layout", "truncate");
  });

  it("has plain headers when sorting is off", () => {
    render(<SimpleTable columns={columns} data={data} />);
    expect(screen.queryByRole("button", { name: /sort by/i })).not.toBeInTheDocument();
  });

  it("sorts ascending, then descending, when a sortable header is clicked", async () => {
    render(<SimpleTable columns={columns} data={data} enableSorting />);
    const header = () => screen.getByRole("columnheader", { name: /name/i });
    expect(header()).toHaveAttribute("aria-sort", "none");
    await userEvent.click(screen.getByRole("button", { name: "Sort by name" }));
    expect(names()).toEqual(["Abe", "Bea", "Cara"]);
    expect(header()).toHaveAttribute("aria-sort", "ascending");
    await userEvent.click(screen.getByRole("button", { name: "Sort by name" }));
    expect(names()).toEqual(["Cara", "Bea", "Abe"]);
    expect(header()).toHaveAttribute("aria-sort", "descending");
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
