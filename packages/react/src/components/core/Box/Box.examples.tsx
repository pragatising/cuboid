import { Box, Text } from "@sragatiping/cuboid";

export function Column() {
  return (
    <Box gap="1x">
      <Text>First</Text>
      <Text>Second</Text>
      <Text>Third</Text>
    </Box>
  );
}

export function Row() {
  return (
    <Box flexDirection="row" alignItems="center" gap="2x">
      <Text>Left</Text>
      <Text color="neutral.muted">Middle</Text>
      <Text>Right</Text>
    </Box>
  );
}

export function Surface() {
  return (
    <Box padding="2x" borderRadius="md" backgroundColor="canvas.inset" gap="1x">
      <Text weight="semibold">A surface</Text>
      <Text color="neutral.muted">Padding, radius and a background, all from tokens.</Text>
    </Box>
  );
}
