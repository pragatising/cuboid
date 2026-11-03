import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ActionMenu } from "../ActionMenu";
import { Box } from "../Box";
import { Table } from "./Table";
import type { TableSort } from "./types";

const meta: Meta<typeof Table> = {
  title: "Core/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    density: { control: "inline-radio", options: ["dense", "spacious"] },
    lines: { control: "inline-radio", options: ["none", "rows", "grid"] },
    rowLayout: { control: "inline-radio", options: ["wrap", "truncate"] },
    layout: { control: "inline-radio", options: ["auto", "fixed", "scroll"] },
  },
};
export default meta;
type Story = StoryObj<typeof Table>;

const menu = (
  <>
    <ActionMenu.Item>Sort ascending</ActionMenu.Item>
    <ActionMenu.Item>Sort descending</ActionMenu.Item>
    <ActionMenu.Item>Hide column</ActionMenu.Item>
  </>
);

export const Playground: Story = {
  args: { density: "dense", lines: "grid", rowLayout: "truncate" },
  render: (args) => (
    <Table {...args}>
        <Table.Header>
          <Table.Row>
            <Table.HeadCell>Shape</Table.HeadCell>
            <Table.HeadCell align="right">Faces</Table.HeadCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Cube</Table.Cell>
            <Table.Cell align="right">6</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Tetrahedron</Table.Cell>
            <Table.Cell align="right">4</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
  ),
};

/** The Figma header variants: label only, kebab on hover, sorted ascending, sorted descending. */
export const HeaderCells: Story = {
  render: () => (
    <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeadCell>Plain</Table.HeadCell>
            <Table.HeadCell menu={menu} sort="none">Menu (hover me)</Table.HeadCell>
            <Table.HeadCell menu={menu} sort="asc">Ascending</Table.HeadCell>
            <Table.HeadCell menu={menu} sort="desc">Descending</Table.HeadCell>
            <Table.HeadCell sort="asc">Mark only</Table.HeadCell>
          </Table.Row>
        </Table.Header>
      </Table>
  ),
};

export const ColumnMenu: Story = {
  render: function Render() {
    const [sort, setSort] = useState<TableSort>("none");
    return (
      <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeadCell
                sort={sort}
                menu={
                  <>
                    <ActionMenu.Item onClick={() => setSort("asc")}>Sort ascending</ActionMenu.Item>
                    <ActionMenu.Item onClick={() => setSort("desc")}>Sort descending</ActionMenu.Item>
                    <ActionMenu.Item onClick={() => setSort("none")}>Clear sort</ActionMenu.Item>
                  </>
                }
              >
                Shape
              </Table.HeadCell>
            </Table.Row>
          </Table.Header>
        </Table>
    );
  },
};

export const Cells: Story = {
  render: () => (
    <Box gap="2x" style={{ width: "28rem" }}>
      <Table>
          <colgroup>
            <col style={{ width: "10rem" }} />
            <col />
          </colgroup>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Text</Table.Cell>
              <Table.Cell loading />
            </Table.Row>
            <Table.Row>
              <Table.Cell>A component name too long for its column</Table.Cell>
              <Table.Cell rowLayout="wrap">Wraps onto as many lines as it needs, so nothing is hidden and no tooltip is needed.</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
    </Box>
  ),
};

export const DensityAndLines: Story = {
  render: () => (
    <Box gap="3x">
      {(["spacious", "dense"] as const).flatMap((density) =>
        (["grid", "rows", "none"] as const).map((lines) => (
          <Table key={`${density}-${lines}`} density={density} lines={lines}>
              <Table.Header>
                <Table.Row>
                  <Table.HeadCell>{`${density}, ${lines}`}</Table.HeadCell>
                  <Table.HeadCell>B</Table.HeadCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>a</Table.Cell>
                  <Table.Cell>b</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
        )),
      )}
    </Box>
  ),
};
