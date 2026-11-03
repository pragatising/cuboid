import { Table } from "@sragatiping/cuboid";
import { defineReadBlock } from "../../core";

/**
 * The table: its rows (`tableRow`) and their cells (`tableHeader`, `tableCell`) are drawn by the reader as Cuboid's `Table` parts, and the frame
 * and the table by this. The rows sit in one body, header cells and all, exactly as the editor builds them, so the same stylesheet draws both.
 */
export const tableRead = defineReadBlock({
  name: "table",
  attrs: {},
  Read: ({ children }) => (
    <Table density="spacious" rowLayout="wrap">
      <Table.Body>{children}</Table.Body>
    </Table>
  ),
});
