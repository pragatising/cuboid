import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "../Link";
import { Pill } from "../Pill";
import { Stack } from "../Stack";
import { SimpleTable, Table } from "./Table";

type ApplicantRow = {
  appId: string;
  productName: string;
  productType: string;
  applicantName: string;
  annualIncome: string;
  state: string;
};

const SAMPLE_DATA: ApplicantRow[] = [
  {
    appId: "ODX1224323",
    productName: "Personal Loan",
    productType: "Consumer",
    applicantName: "Jane Cooper",
    annualIncome: "$150,000",
    state: "CA",
  },
  {
    appId: "ODX1224324",
    productName: "Auto Refinance with a very long product name that should truncate",
    productType: "Consumer",
    applicantName: "Robert Fox",
    annualIncome: "$92,500",
    state: "TX",
  },
  {
    appId: "ODX1224325",
    productName: "Credit Card",
    productType: "Consumer",
    applicantName: "Leslie Alexander",
    annualIncome: "$68,000",
    state: "NY",
  },
];

const SAMPLE_COLUMNS: ColumnDef<ApplicantRow, unknown>[] = [
  {
    accessorKey: "appId",
    header: "App ID",
    size: 120,
    cell: ({ getValue }) => (
      <Link href="#" variant="inline">
        {String(getValue())}
      </Link>
    ),
  },
  {
    accessorKey: "productName",
    header: "Product Name",
    meta: { rowLayout: "truncate" },
  },
  {
    accessorKey: "productType",
    header: "Product Type",
    size: 120,
    cell: ({ getValue }) => (
      <Pill shade="gray" intensity="extralight" border>
        {String(getValue())}
      </Pill>
    ),
  },
  {
    accessorKey: "applicantName",
    header: "Applicant Name",
    size: 160,
  },
  {
    accessorKey: "annualIncome",
    header: "Annual Income",
    size: 120,
    meta: { align: "right" },
  },
  {
    accessorKey: "state",
    header: "State",
    size: 72,
  },
];

const meta: Meta<typeof SimpleTable> = {
  title: "Core/Table",
  component: SimpleTable,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof SimpleTable<ApplicantRow>>;

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
        "accessorKey" in col && col.accessorKey === "productName"
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
    <Stack gap="lg">
      <SimpleTable columns={SAMPLE_COLUMNS.slice(0, 3)} data={SAMPLE_DATA} rowLayout="truncate" />
      <SimpleTable columns={SAMPLE_COLUMNS.slice(0, 3)} data={SAMPLE_DATA} rowLayout="fixed" />
    </Stack>
  ),
};
