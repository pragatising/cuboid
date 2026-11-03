import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ActionMenu } from "../../ActionMenu";
import { expectNoAxeViolations } from "../../../../test/testing";
import { Table } from "../Table";

const head = (props: React.ComponentProps<typeof Table.HeadCell> = {}) => (
  <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeadCell {...props}>{props.children ?? "Name"}</Table.HeadCell>
        </Table.Row>
      </Table.Header>
    </Table>
);

const menu = (
  <>
    <ActionMenu.Item>Sort ascending</ActionMenu.Item>
    <ActionMenu.Item>Sort descending</ActionMenu.Item>
  </>
);

describe("Table.HeadCell: plain", () => {
  it("is a column header with its label and nothing else", () => {
    render(head());
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute("scope", "col");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("columnheader")).not.toHaveAttribute("aria-sort");
  });

  it("marks its alignment", () => {
    render(head({ align: "right" }));
    expect(screen.getByRole("columnheader")).toHaveAttribute("data-align", "right");
  });

  it("takes anything as its content", () => {
    render(head({ children: <input type="checkbox" aria-label="Select all" /> }));
    expect(screen.getByRole("checkbox", { name: "Select all" })).toBeInTheDocument();
  });
});

describe("Table.HeadCell: sort", () => {
  it.each([
    ["none", "none"],
    ["asc", "ascending"],
    ["desc", "descending"],
  ] as const)("sort=%s is aria-sort=%s", (sort, aria) => {
    render(head({ sort }));
    expect(screen.getByRole("columnheader")).toHaveAttribute("aria-sort", aria);
  });

  it("shows the direction of a sorted column that has no menu, and nothing for an unsorted one", () => {
    const { container, rerender } = render(head({ sort: "asc" }));
    expect(container.querySelector('[data-component="Table.HeadCell.SortMark"]')).not.toBeNull();
    rerender(head({ sort: "none" }));
    expect(container.querySelector('[data-component="Table.HeadCell.SortMark"]')).toBeNull();
  });
});

describe("Table.HeadCell: menu", () => {
  it("ends in a button that opens the column's menu", async () => {
    render(head({ menu }));
    const button = screen.getByRole("button", { name: "Column options" });
    expect(button).toHaveAttribute("aria-haspopup");
    expect(button).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Sort ascending" })).toBeInTheDocument();
  });

  it("names the button from menuLabel", () => {
    render(head({ menu, menuLabel: "Name options" }));
    expect(screen.getByRole("button", { name: "Name options" })).toBeInTheDocument();
  });

  it("is the kebab until the column is sorted, then the arrow, and one button either way", () => {
    const { rerender } = render(head({ menu }));
    expect(screen.getByRole("button")).toHaveAttribute("data-sort", "none");
    rerender(head({ menu, sort: "desc" }));
    expect(screen.getByRole("button")).toHaveAttribute("data-sort", "desc");
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("is reachable and operable from the keyboard", async () => {
    render(head({ menu }));
    await userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("menuitem", { name: "Sort ascending" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem")).toBeNull();
    expect(screen.getByRole("button")).toHaveFocus();
  });

  it("has no axe violations, closed and open", async () => {
    const { container } = render(head({ menu, sort: "asc" }));
    await expectNoAxeViolations(container);
    await userEvent.click(screen.getByRole("button"));
    await expectNoAxeViolations(container);
  });
});
