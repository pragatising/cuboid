import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "../Link";
import { Pill } from "../Pill";
import { Box } from "../Box";
import { SimpleTable, Table } from "./Table";

type ComponentRow = {
  id: string;
  name: string;
  category: string;
  owner: string;
  weeklyUses: string;
  status: string;
};

const SAMPLE_DATA: ComponentRow[] = [
  {
    id: "CMP-1042",
    name: "Button",
    category: "Actions",
    owner: "Jane Cooper",
    weeklyUses: "1,240",
    status: "Stable",
  },
  {
    id: "CMP-1043",
    name: "Data grid with a very long component name that should truncate",
    category: "Data",
    owner: "Robert Fox",
    weeklyUses: "312",
    status: "Beta",
  },
  {
    id: "CMP-1044",
    name: "Tooltip",
    category: "Overlays",
    owner: "Leslie Alexander",
    weeklyUses: "868",
    status: "Stable",
  },
];

const SAMPLE_COLUMNS: ColumnDef<ComponentRow, unknown>[] = [
  {
    accessorKey: "id",
    header: "ID",
    size: 120,
    cell: ({ getValue }) => (
      <Link href="#" variant="inline">
        {String(getValue())}
      </Link>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    meta: { rowLayout: "truncate" },
  },
  {
    accessorKey: "category",
    header: "Category",
    size: 120,
    cell: ({ getValue }) => (
      <Pill shade="gray" intensity="extraLight" border>
        {String(getValue())}
      </Pill>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    size: 160,
  },
  {
    accessorKey: "weeklyUses",
    header: "Weekly uses",
    size: 120,
    meta: { align: "right" },
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 96,
  },
];

const meta: Meta<typeof SimpleTable> = {
  title: "Core/Table",
  component: SimpleTable,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof SimpleTable<ComponentRow>>;

export const Simple: Story = {
  render: () => (
    <SimpleTable columns={SAMPLE_COLUMNS} data={SAMPLE_DATA} rowLayout="truncate" density="spacious" />
  ),
};

export const Dense: Story = {
  render: () => (
    <SimpleTable columns={SAMPLE_COLUMNS} data={SAMPLE_DATA} rowLayout="truncate" density="dense" />
  ),
};

export const LinesGrid: Story = {
  name: "Lines — grid",
  render: () => (
    <SimpleTable columns={SAMPLE_COLUMNS} data={SAMPLE_DATA.slice(0, 2)} lines="grid" />
  ),
};

export const LinesRows: Story = {
  name: "Lines — rows",
  render: () => (
    <SimpleTable columns={SAMPLE_COLUMNS} data={SAMPLE_DATA.slice(0, 2)} lines="rows" />
  ),
};

export const LinesNone: Story = {
  name: "Lines — none",
  render: () => (
    <SimpleTable columns={SAMPLE_COLUMNS} data={SAMPLE_DATA.slice(0, 2)} lines="none" />
  ),
};

export const WrappedCells: Story = {
  render: () => (
    <SimpleTable
      columns={SAMPLE_COLUMNS.map((col) =>
        "accessorKey" in col && col.accessorKey === "name"
          ? { ...col, meta: { rowLayout: "wrap" as const } }
          : col,
      )}
      data={SAMPLE_DATA}
      rowLayout="truncate"
    />
  ),
};

export const FixedRowHeight: Story = {
  render: () => <SimpleTable columns={SAMPLE_COLUMNS} data={SAMPLE_DATA} rowLayout="fixed" />,
};

export const Composable: Story = {
  render: () => (
    <Table.Root density="spacious">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeadCell>Shape</Table.HeadCell>
            <Table.HeadCell>Motion</Table.HeadCell>
            <Table.HeadCell>Effort</Table.HeadCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell rowLayout="wrap">Sphere</Table.Cell>
            <Table.Cell rowLayout="truncate">
              <Pill shade="blue" intensity="light">
                Rolling
              </Pill>
            </Table.Cell>
            <Table.Cell rowLayout="truncate">
              <Pill shade="orange" intensity="light">
                Very Low
              </Pill>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </Table.Root>
  ),
};

export const RowLayouts: Story = {
  render: () => (
    <Box gap="lg">
      <SimpleTable columns={SAMPLE_COLUMNS.slice(0, 3)} data={SAMPLE_DATA} rowLayout="truncate" />
      <SimpleTable columns={SAMPLE_COLUMNS.slice(0, 3)} data={SAMPLE_DATA} rowLayout="fixed" />
    </Box>
  ),
};
