import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../../../../test/testing";

const cut = vi.hoisted(() => ({ value: false }));
// jsdom has no layout, so the measuring is answered here: this is the behaviour's own test's business, not the cell's.
vi.mock("../../../../behaviors/useTruncation", () => ({ useTruncation: ({ enabled = true }: { enabled?: boolean }) => enabled && cut.value }));

import { Table } from "../Table";
import { TableCell } from "./TableCell";

const cell = (props: React.ComponentProps<typeof TableCell> = {}) =>
  render(
    <table>
      <tbody>
        <tr>
          <TableCell {...props}>{props.children ?? "Sphere"}</TableCell>
        </tr>
      </tbody>
    </table>,
  );

afterEach(() => {
  cut.value = false;
});

describe("Table.Cell", () => {
  it("marks its alignment and row layout (wrap by default)", () => {
    cell({ align: "right" });
    expect(screen.getByRole("cell")).toHaveAttribute("data-align", "right");
    expect(screen.getByRole("cell")).toHaveAttribute("data-row-layout", "wrap");
  });

  it("takes a row layout", () => {
    cell({ rowLayout: "truncate" });
    expect(screen.getByRole("cell")).toHaveAttribute("data-row-layout", "truncate");
  });

  it("passes other attributes to the td", () => {
    cell({ colSpan: 2, id: "c" });
    expect(screen.getByRole("cell")).toHaveAttribute("colspan", "2");
    expect(screen.getByRole("cell")).toHaveAttribute("id", "c");
  });
});

describe("Table.Cell: loading", () => {
  it("shows a skeleton in place of the content, and says it is busy", () => {
    const { container } = cell({ loading: true });
    expect(screen.queryByText("Sphere")).toBeNull();
    expect(container.querySelector('[data-component="Table.Cell.Skeleton"]')).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("cell")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("cell")).toHaveAttribute("data-loading");
    expect(screen.getByRole("cell")).toHaveTextContent("Loading");
  });

  it("shows its content once loaded, and is no longer busy", () => {
    cell({ loading: false });
    expect(screen.getByRole("cell")).toHaveTextContent("Sphere");
    expect(screen.getByRole("cell")).not.toHaveAttribute("aria-busy");
  });

  it("has no axe violations loading", async () => {
    const { container } = cell({ loading: true });
    await expectNoAxeViolations(container);
  });
});

describe("Table.Cell: truncated text", () => {
  const popover = () => document.querySelector('[data-component="Popover"]');

  it("is plain when the text fits: no tab stop, no popover", async () => {
    cut.value = false;
    cell({ rowLayout: "truncate" });
    expect(screen.getByRole("cell").querySelector("[tabindex]")).toBeNull();
    await userEvent.click(screen.getByRole("cell"));
    expect(popover()).toBeNull();
  });

  it("makes cut-off text a tab stop, and focusing it opens a popover with the whole text", async () => {
    cut.value = true;
    cell({ rowLayout: "truncate", children: "A very long component name" });
    const stop = screen.getByRole("cell").querySelector("[tabindex='0']") as HTMLElement;
    expect(stop).toHaveTextContent("A very long component name");
    expect(popover()).toBeNull();
    await userEvent.tab();
    expect(stop).toHaveFocus();
    expect(popover()).toHaveTextContent("A very long component name");
    expect(stop).toHaveAttribute("aria-expanded", "true");
  });

  it("opens on a click, and Escape closes it", async () => {
    cut.value = true;
    cell({ rowLayout: "truncate", children: "A very long component name" });
    await userEvent.click(screen.getByRole("cell").querySelector("[tabindex='0']") as HTMLElement);
    expect(popover()).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    expect(popover()).toBeNull();
  });

  it("opens after the pointer rests on it, and closes when it leaves", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      cut.value = true;
      cell({ rowLayout: "truncate", children: "A very long component name" });
      const stop = screen.getByRole("cell").querySelector("[tabindex='0']") as HTMLElement;
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.hover(stop);
      expect(popover()).toBeNull();
      await act(async () => void vi.advanceTimersByTime(500));
      expect(popover()).toHaveTextContent("A very long component name");
      await user.unhover(stop);
      expect(popover()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("takes the whole text from fullText when the content is not a string", async () => {
    cut.value = true;
    cell({ rowLayout: "truncate", fullText: "Sphere (3D)", children: <b>Sphere</b> });
    await userEvent.click(screen.getByRole("cell").querySelector("[tabindex='0']") as HTMLElement);
    expect(popover()).toHaveTextContent("Sphere (3D)");
  });

  it("offers nothing for content that is not text and has no fullText", () => {
    cut.value = true;
    cell({ rowLayout: "truncate", children: <b>Sphere</b> });
    expect(screen.getByRole("cell").querySelector("[tabindex]")).toBeNull();
  });

  it("does not watch a wrapping cell, which cuts nothing off", () => {
    cut.value = true;
    cell({ rowLayout: "wrap" });
    expect(screen.getByRole("cell").querySelector("[tabindex]")).toBeNull();
  });

  it("takes its row layout from the table, and a cell's own wins", () => {
    cut.value = true;
    render(
      <Table rowLayout="truncate">
          <Table.Body>
            <Table.Row>
              <Table.Cell>inherits</Table.Cell>
              <Table.Cell rowLayout="wrap">own</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
    );
    expect(screen.getByRole("cell", { name: "inherits" })).toHaveAttribute("data-row-layout", "truncate");
    expect(screen.getByRole("cell", { name: "own" })).toHaveAttribute("data-row-layout", "wrap");
  });
});
