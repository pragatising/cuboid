import { Box, Heading, Subtitle } from "@sragatiping/cuboid";

export function Default() {
  return <Subtitle>Supporting text that describes the page.</Subtitle>;
}

export function UnderAHeading() {
  return (
    <Box gap="0.5x">
      <Heading as="h1">Billing</Heading>
      <Subtitle>Manage your plan, payment methods and invoices.</Subtitle>
    </Box>
  );
}
