import { Box, Text } from "@sragatiping/cuboid";

export function Default() {
  return <Text>The quick brown fox jumps over the lazy dog.</Text>;
}

export function Sizes() {
  return (
    <Box gap="1x">
      <Text size="lg">Large</Text>
      <Text size="md">Medium</Text>
      <Text size="sm">Small</Text>
    </Box>
  );
}

export function Weights() {
  return (
    <Box gap="0.5x">
      {(["light", "normal", "medium", "semibold"] as const).map((weight) => (
        <Text key={weight} weight={weight}>{weight}</Text>
      ))}
    </Box>
  );
}

export function Colours() {
  return (
    <Box gap="0.5x">
      {(["neutral.default", "neutral.muted", "neutral.subtle", "success.strong", "danger.strong", "warning.strong", "informational.strong"] as const).map((color) => (
        <Text key={color} color={color}>{color}</Text>
      ))}
    </Box>
  );
}

export function Truncated() {
  return (
    <Box style={{ width: "16rem" }}>
      <Text truncate>A line that is longer than the room it has, cut off with an ellipsis.</Text>
    </Box>
  );
}
