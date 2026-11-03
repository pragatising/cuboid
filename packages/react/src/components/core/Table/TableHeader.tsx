import React from "react";

export type TableHeaderProps = React.ComponentPropsWithRef<"thead">;

export function TableHeader(props: TableHeaderProps) {
  return <thead data-component="Table.Header" {...props} />;
}
