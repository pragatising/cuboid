import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pill } from "../Pill";
import { SimpleTable } from "./Table";
import { Stack } from "../Stack";
import { Text } from "../Text";

type RoadmapState = "Shipped" | "In progress" | "Backlog" | "Open" | "Technical debt";

type RoadmapRow = {
  component: string;
  state: RoadmapState;
  area: string;
  notes: string;
};

const ROADMAP_COLUMNS: ColumnDef<RoadmapRow, unknown>[] = [
  {
    accessorKey: "component",
    header: "Component",
    meta: { width: "24%" },
  },
  {
    accessorKey: "state",
    header: "State",
    meta: { width: "17%" },
    cell: ({ getValue }) => {
      const state = getValue<RoadmapState>();
      const shade = state === "Shipped" ? "blue" : state === "Backlog" ? "gray" : "orange";
      return (
        <Pill shade={shade} intensity="light" border>
          {state}
        </Pill>
      );
    },
  },
  {
    accessorKey: "area",
    header: "Area",
    meta: { width: "19%" },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    meta: { rowLayout: "wrap" },
  },
];

const SHIPPED: RoadmapRow[] = [
  { component: "Stack", state: "Shipped", area: "Core", notes: "Layout primitive with responsive spacing." },
  { component: "Table primitives", state: "Shipped", area: "Core", notes: "Composable Root, Header, Body, Row, Cell, and HeadCell parts." },
  { component: "SimpleTable", state: "Shipped", area: "Core", notes: "TanStack-powered table with opt-in sortable headers." },
  { component: "Container", state: "Shipped", area: "Core", notes: "Constrained page and content widths." },
  { component: "Box", state: "Shipped", area: "Core", notes: "Token-backed surface and layout primitive." },
  { component: "Divider", state: "Shipped", area: "Core", notes: "Horizontal and vertical separators." },
  { component: "Callout", state: "Shipped", area: "Core", notes: "Semantic message surface." },
  { component: "Highlight", state: "Shipped", area: "Core", notes: "Inline emphasis surface." },
  { component: "Text", state: "Shipped", area: "Core", notes: "Role- and size-driven typography." },
  { component: "Button", state: "Shipped", area: "Core", notes: "Action control variants and sizes." },
  { component: "IconButton", state: "Shipped", area: "Core", notes: "Icon-only action with tooltip support." },
  { component: "Tooltip", state: "Shipped", area: "Core", notes: "Hover and focus descriptions." },
  { component: "Icon", state: "Shipped", area: "Core", notes: "Consistent icon sizing and accessibility wrapper." },
  { component: "Link", state: "Shipped", area: "Core", notes: "Inline, standalone, and external link styles." },
  { component: "Pill", state: "Shipped", area: "Core", notes: "Status and label surface with shade recipes." },
  { component: "Breadcrumbs", state: "Shipped", area: "Core", notes: "Hierarchical navigation." },
  { component: "SiteHeader", state: "Shipped", area: "Core", notes: "Application header structure." },
  { component: "Overlay", state: "Shipped", area: "Core", notes: "Modal backdrop primitive." },
  { component: "Sheet", state: "Shipped", area: "Core", notes: "Edge-anchored slide-in surface." },
  { component: "ResizeHandle", state: "Shipped", area: "Core", notes: "Resizable layout affordance." },
  { component: "Popover", state: "Shipped", area: "Core", notes: "Trigger-anchored floating surface." },
  { component: "ActionMenu", state: "Shipped", area: "Core", notes: "Keyboard-friendly action menu composition." },
  { component: "Sidebar", state: "Shipped", area: "Core", notes: "Collapsible application navigation." },
  { component: "SplitLayout", state: "Shipped", area: "Core", notes: "Main and secondary pane layout." },
  { component: "CodeSurface", state: "Shipped", area: "Data", notes: "Tokenized code surface with line presentation." },
  { component: "CodeBlock", state: "Shipped", area: "Data", notes: "Highlighted source rendering." },
  { component: "JsonCodeView", state: "Shipped", area: "Data", notes: "Interactive JSON code rendering." },
  { component: "CodeSnippet", state: "Shipped", area: "Data", notes: "Deprecated compatibility export." },
  { component: "ApiResponseViewer", state: "Shipped", area: "Data", notes: "HTTP response metadata and body viewer." },
  { component: "Graph primitives", state: "Shipped", area: "Data", notes: "Canvas, cards, rows, handles, and edges demonstrated in Storybook." },
  { component: "JsonGraph primitives", state: "Shipped", area: "Data", notes: "JSON-specific graph card content and tree layout helpers." },
];

const BACKLOG: RoadmapRow[] = [
  { component: "Avatar", state: "Backlog", area: "Core", notes: "Avatar, stack, overflow, and add-user variants." },
  { component: "Checkbox", state: "Backlog", area: "Core", notes: "Checked, unchecked, mixed, disabled, and error states." },
  { component: "Dialog", state: "Backlog", area: "Core", notes: "Centered modal with focus management and header/body/footer slots." },
  { component: "DatePicker", state: "Backlog", area: "Core", notes: "Date cells plus month and year views." },
  { component: "Radio", state: "Backlog", area: "Core", notes: "Native and pill-style radio groups." },
  { component: "Toggle Switch", state: "Backlog", area: "Core", notes: "On/off control with icon and disabled states." },
  { component: "Relative Time", state: "Backlog", area: "Core", notes: "Small and medium relative timestamp display." },
  { component: "Toast", state: "Backlog", area: "Core", notes: "Neutral, warning, success, error, and dark surfaces." },
  { component: "KeyValue", state: "Backlog", area: "Core", notes: "Typed values, key widths, and nested list layouts." },
  { component: "Smart Link", state: "Backlog", area: "Core", notes: "Rest and hover link treatment." },
  { component: "Split Button", state: "Backlog", area: "Core", notes: "Primary action paired with a menu trigger." },
  { component: "Spinner", state: "Backlog", area: "Core", notes: "Loading indicator across five sizes." },
  { component: "Skeleton", state: "Backlog", area: "Core", notes: "Rectangular and circular loading placeholders." },
  { component: "Accordion", state: "Backlog", area: "Core", notes: "Open and closed disclosure states." },
  { component: "Tabs", state: "Backlog", area: "Core", notes: "Primary and secondary tab lists." },
  { component: "Advanced Query Chip", state: "Backlog", area: "Data", notes: "Filter-builder subsystem with typed operators and values." },
  { component: "Banners", state: "Backlog", area: "Core", notes: "Neutral, info, success, warning, and error messages." },
  { component: "Counter", state: "Backlog", area: "Core", notes: "Numeric badge surface." },
  { component: "Input family", state: "Backlog", area: "Core", notes: "Text input, textarea, and select states." },
  { component: "DataGrid", state: "Backlog", area: "Data", notes: "Replace the current placeholder with a typed data grid." },
  { component: "JsonViewer", state: "Backlog", area: "Data", notes: "Add the code/table mode switch and table rendering." },
];

const FEATURE_UPGRADES: RoadmapRow[] = [
  { component: "Table & Grid cell types", state: "In progress", area: "Data", notes: "Dates, labels, loading, charts, avatars, inputs, and switches." },
  { component: "Table pagination and row actions", state: "Backlog", area: "Data", notes: "Pagination, row-open affordance, and larger dataset behavior." },
  { component: "Icon by name", state: "Backlog", area: "Core", notes: "Convenience API over the existing tree-shakeable icon exports." },
];

const BUGS: RoadmapRow[] = [
  { component: "Popover viewport collision", state: "Open", area: "Core", notes: "Flip or constrain long menus near viewport edges; add max-height and scrolling." },
  { component: "IconButton tooltip labels", state: "Open", area: "Core", notes: "Enforce a tooltip label on IconButton instances so icon-only actions are discoverable." },
  { component: "Graph spacing token migration", state: "Technical debt", area: "Data", notes: "Migrate older Graph and JsonGraph consumers from raw space tokens when those components are revisited." },
];

const meta: Meta<typeof SimpleTable> = {
  title: "Roadmap/Component status",
  component: SimpleTable,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof SimpleTable>;

export const Overview: Story = {
  render: () => (
    <Stack gap="xl" style={{ maxWidth: "78rem" }}>
      <Stack gap="xs">
        <Text role="heading" size="lg">
          Cuboid component roadmap
        </Text>
        <Text role="body" size="sm" color="muted">
          Sort any table by clicking a column heading. This board mirrors the current component backlog and open implementation threads.
        </Text>
      </Stack>

      <Stack gap="sm">
        <Text role="heading" size="md">Shipped</Text>
        <SimpleTable columns={ROADMAP_COLUMNS} data={SHIPPED} enableSorting rowLayout="wrap" density="dense" lines="rows" />
      </Stack>

      <Stack gap="sm">
        <Text role="heading" size="md">Backlog</Text>
        <SimpleTable columns={ROADMAP_COLUMNS} data={BACKLOG} enableSorting rowLayout="wrap" density="dense" lines="rows" />
      </Stack>

      <Stack gap="sm">
        <Text role="heading" size="md">Feature Upgrade</Text>
        <SimpleTable columns={ROADMAP_COLUMNS} data={FEATURE_UPGRADES} enableSorting rowLayout="wrap" density="dense" lines="rows" />
      </Stack>

      <Stack gap="sm">
        <Text role="heading" size="md">Bugs</Text>
        <SimpleTable columns={ROADMAP_COLUMNS} data={BUGS} enableSorting rowLayout="wrap" density="dense" lines="rows" />
      </Stack>
    </Stack>
  ),
};