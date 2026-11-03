import { ApiResponseViewer, Box } from "@sragatiping/cuboid";

const order = {
  id: "ord_1042",
  status: "paid",
  total: 128.5,
  customer: { name: "Ada Lovelace", email: "ada@example.com" },
  items: [
    { sku: "A-1", quantity: 2 },
    { sku: "B-7", quantity: 1 },
  ],
};

export function Success() {
  return (
    <ApiResponseViewer
      method="GET"
      url="https://api.example.com/orders/1042"
      status={200}
      durationMs={142}
      headers={{ "content-type": "application/json", "cache-control": "no-store" }}
      body={order}
    />
  );
}

export function Created() {
  return <ApiResponseViewer method="POST" url="https://api.example.com/orders" status={201} durationMs={310} body={{ id: "ord_1043" }} />;
}

export function Statuses() {
  return (
    <Box gap="2x">
      <ApiResponseViewer method="GET" url="/orders/1" status={204} body={null} />
      <ApiResponseViewer method="GET" url="/orders/404" status={404} body={{ error: "Not found" }} />
      <ApiResponseViewer method="DELETE" url="/orders/1" status={500} body={{ error: "Something went wrong" }} />
    </Box>
  );
}
