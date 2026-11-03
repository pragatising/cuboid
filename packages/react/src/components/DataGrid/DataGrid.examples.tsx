import { DataGrid } from "@sragatiping/cuboid";

/** A placeholder today: it prints the rows it is given until the table view is built. */
export function Default() {
  return (
    <DataGrid
      data={[
        { id: 1, name: "Ada Lovelace", role: "Mathematician" },
        { id: 2, name: "Grace Hopper", role: "Computer scientist" },
      ]}
    />
  );
}
