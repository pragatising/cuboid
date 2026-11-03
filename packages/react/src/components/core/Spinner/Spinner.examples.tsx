import { Box, Spinner, Text } from "@sragatiping/cuboid";

export function Default() {
  return <Spinner label="Loading" />;
}

/** The ring is 2px thick at every size. */
export function Sizes() {
  return (
    <Box flexDirection="row" alignItems="center" gap="3x">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Spinner key={size} size={size} label={`Loading (${size})`} />
      ))}
    </Box>
  );
}

export function Colours() {
  return (
    <Box flexDirection="row" alignItems="center" gap="3x">
      <Spinner size="md" color="neutral.muted" label="Loading" />
      <Spinner size="md" color="informational.strong" label="Loading" />
      <Spinner size="md" color="danger.strong" label="Loading" />
    </Box>
  );
}

/** With no size it is as large as the text it sits in. */
export function BesideText() {
  return (
    <Text>
      <Spinner /> Saving your changes
    </Text>
  );
}
