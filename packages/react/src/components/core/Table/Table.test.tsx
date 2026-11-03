import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, resolveVariable, themeVariables } from "../../../test/themeCss";
import { Table } from "./Table";

behavesAsComponent({ Component: Table, dataComponent: "Table" });

const sample = (props: { density?: "dense" | "spacious"; lines?: "none" | "rows" | "grid"; layout?: "auto" | "fixed" | "scroll"; rowLayout?: "wrap" | "truncate" } = {}) => (
  <Table {...props}>
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
);

describe("Table: parts", () => {
  it("compose into a real table", () => {
    render(sample());
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Shape" })).toHaveAttribute("scope", "col");
    expect(screen.getByRole("cell", { name: "Sphere" })).toBeInTheDocument();
  });

  it("names every part by its dotted path", () => {
    const { container } = render(sample());
    for (const name of ["Table.Root", "Table", "Table.Header", "Table.Body", "Table.Row", "Table.HeadCell", "Table.Cell"]) {
      expect(container.querySelector(`[data-component="${name}"]`), name).not.toBeNull();
    }
  });

  it("has no axe violations", async () => {
    const { container } = render(sample());
    await expectNoAxeViolations(container);
  });
});

describe("Table: the frame and the choices for the whole table", () => {
  it("marks density, lines and layout: dense, grid and fixed (it truncates) by default", () => {
    const { container, rerender } = render(sample());
    const root = () => container.querySelector('[data-component="Table.Root"]') as HTMLElement;
    expect(root()).toHaveAttribute("data-density", "dense");
    expect(root()).toHaveAttribute("data-lines", "grid");
    expect(root()).toHaveAttribute("data-layout", "fixed");
    rerender(sample({ density: "spacious", lines: "none", layout: "auto" }));
    expect(root()).toHaveAttribute("data-density", "spacious");
    expect(root()).toHaveAttribute("data-lines", "none");
    expect(root()).toHaveAttribute("data-layout", "auto");
  });

  it("follows rowLayout for the column layout unless it is given: truncating needs columns that share a width", () => {
    const { container, rerender } = render(sample({ rowLayout: "truncate" }));
    const root = () => container.querySelector('[data-component="Table.Root"]') as HTMLElement;
    expect(root()).toHaveAttribute("data-layout", "fixed");
    rerender(sample({ rowLayout: "truncate", layout: "auto" }));
    expect(root()).toHaveAttribute("data-layout", "auto");
    rerender(sample({ rowLayout: "wrap" }));
    expect(root()).toHaveAttribute("data-layout", "auto");
  });

  it("sets no inline style: the look is the stylesheet's", () => {
    const { container } = render(sample());
    expect(container.querySelector("[style]")).toBeNull();
  });
});

describe("Table: the frame", () => {
  it("puts the table's own className, style and ref on the table, and the frame's on wrapperClassName and wrapperProps", () => {
    const ref = { current: null as HTMLTableElement | null };
    const { container } = render(
      <Table ref={ref} className="on-table" wrapperClassName="on-frame" wrapperProps={{ id: "frame", "data-x": "y" } as object}>
        <Table.Body />
      </Table>,
    );
    const frame = container.querySelector('[data-component="Table.Root"]') as HTMLElement;
    expect(frame).toHaveClass("on-frame");
    expect(frame).toHaveAttribute("id", "frame");
    expect(frame).toHaveAttribute("data-x", "y");
    expect(frame).not.toHaveClass("on-table");
    expect(ref.current).toBe(container.querySelector("table"));
    expect(ref.current).toHaveClass("on-table");
  });

  it("is a frame around exactly one table", () => {
    const { container } = render(sample());
    const frame = container.querySelector('[data-component="Table.Root"]') as HTMLElement;
    expect(frame.children).toHaveLength(1);
    expect(frame.firstElementChild).toBe(container.querySelector("table"));
  });

  it("takes scroll as a layout, which keeps the columns' own widths", () => {
    const { container } = render(sample({ layout: "scroll" }));
    expect((container.querySelector('[data-component="Table.Root"]') as HTMLElement).dataset.layout).toBe("scroll");
  });
});

describe("Table: tokens", () => {
  it("reads only --cube-* variables that exist in the built theme.css, in both modes", () => {
    const read = cubeVariablesRead(readSource("src/components/core/Table/Table.module.css"));
    expect(read.length).toBeGreaterThan(0);
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });

  it.each(["light", "dark"] as const)("resolves the colours and sizes it reads to tokens.%s.table", (mode) => {
    const { table } = tokens[mode];
    expect(resolveVariable("--cube-table-color-header-bgColor", mode)).toBe(table.color.header.bgColor);
    expect(resolveVariable("--cube-table-color-body-fgColor", mode)).toBe(table.color.body.fgColor);
    expect(resolveVariable("--cube-table-color-container-borderColor", mode)).toBe(table.color.container.borderColor);
    expect(resolveVariable("--cube-table-color-skeleton-bgColor", mode)).toBe(table.color.skeleton.bgColor);
    expect(resolveVariable("--cube-table-sizes-density-dense-rowHeight", mode)).toBe(table.sizes.density.dense.rowHeight);
    expect(resolveVariable("--cube-table-sizes-density-spacious-cellPaddingInline", mode)).toBe(table.sizes.density.spacious.cellPaddingInline);
  });

  it("never uses a pseudo-element inside :where(), which would drop the rule", () => {
    const css = readSource("src/components/core/Table/Table.module.css");
    expect(css).not.toMatch(/:where\([^)]*::/);
  });
});
