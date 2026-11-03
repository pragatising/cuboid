import { Box, Link, Text } from "@sragatiping/cuboid";

export function Standalone() {
  return <Link href="#docs">Documentation</Link>;
}

export function Inline() {
  return (
    <Text>
      Read the <Link href="#start" variant="inline">getting started guide</Link> for the setup steps.
    </Text>
  );
}

export function External() {
  return (
    <Box gap="1x">
      <Link href="https://example.com" external>Opens in a new tab</Link>
      <Link href="https://example.com" external showExternalIcon={false}>Opens in a new tab, no icon</Link>
    </Box>
  );
}

export function Underline() {
  return (
    <Box gap="1x">
      {(["always", "hover", "none"] as const).map((underline) => (
        <Link key={underline} href="#x" underline={underline}>underline: {underline}</Link>
      ))}
    </Box>
  );
}

export function Inactive() {
  return <Link href="#x" inactive>A link that is not available</Link>;
}
