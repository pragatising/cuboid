import React from "react";

export type TableBodyProps = React.ComponentPropsWithRef<"tbody">;

export function TableBody(props: TableBodyProps) {
  return <tbody data-component="Table.Body" {...props} />;
}
