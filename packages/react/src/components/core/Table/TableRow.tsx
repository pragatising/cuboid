import React from "react";

export type TableRowProps = React.ComponentPropsWithRef<"tr">;

export function TableRow(props: TableRowProps) {
  return <tr data-component="Table.Row" {...props} />;
}
