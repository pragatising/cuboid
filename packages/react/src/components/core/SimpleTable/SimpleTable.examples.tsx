import { Pill, SimpleTable } from "@sragatiping/cuboid";
import type { ColumnDef } from "@sragatiping/cuboid";

type Component = { name: string; owner: string; status: string; uses: number };

const data: Component[] = [
  { name: "Button", owner: "Jane Cooper", status: "Stable", uses: 1240 },
  { name: "Tooltip", owner: "Leslie Alexander", status: "Stable", uses: 868 },
  { name: "Data grid", owner: "Robert Fox", status: "Beta", uses: 312 },
  { name: "Popover", owner: "Jane Cooper", status: "Stable", uses: 640 },
  { name: "Date picker", owner: "Cody Fisher", status: "Beta", uses: 204 },
  { name: "Command palette", owner: "Esther Howard", status: "Planned", uses: 0 },
];

const columns: ColumnDef<Component, unknown>[] = [
  { accessorKey: "name", header: "Component" },
  { accessorKey: "owner", header: "Owner" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return (
        <Pill shade={status === "Stable" ? "blue" : status === "Beta" ? "orange" : "gray"} intensity="light" bordered>
          {status}
        </Pill>
      );
    },
  },
  { accessorKey: "uses", header: "Weekly uses", meta: { align: "right" } },
];

export function Default() {
  return <SimpleTable columns={columns} data={data} />;
}

/** Each column's header menu sorts it. */
export function Sortable() {
  return <SimpleTable columns={columns} data={data} enableSorting />;
}

export function Dense() {
  return <SimpleTable columns={columns} data={data} density="dense" lines="rows" />;
}
