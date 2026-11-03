import { JsonViewer } from "@sragatiping/cuboid";

const data = { id: "ord_1042", status: "paid", items: [{ sku: "A-1", quantity: 2 }] };

/** A placeholder today: the switch between the code view and the table view is not built. */
export function Code() {
  return <JsonViewer data={data} />;
}

export function Table() {
  return <JsonViewer data={data} defaultMode="table" />;
}
