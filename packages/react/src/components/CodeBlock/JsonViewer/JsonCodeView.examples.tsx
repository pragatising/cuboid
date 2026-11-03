import { JsonCodeView } from "@sragatiping/cuboid";

const response = {
  id: "ord_1042",
  status: "paid",
  total: 128.5,
  paid: true,
  customer: { name: "Ada Lovelace", email: "ada@example.com", site: "https://example.com/ada" },
  items: [
    { sku: "A-1", quantity: 2 },
    { sku: "B-7", quantity: 1 },
  ],
  note: null,
};

export function Default() {
  return <JsonCodeView data={response} />;
}

export function Collapsed() {
  return <JsonCodeView data={response} defaultCollapsed />;
}

export function WithoutLinks() {
  return <JsonCodeView data={response} linkify={false} />;
}

export function ScrollsWhenTall() {
  return <JsonCodeView data={Array.from({ length: 30 }, (_, index) => ({ id: index, label: `Item ${index}` }))} maxHeight="240px" />;
}
