import { Box, Icon, Pill, Text } from "@sragatiping/cuboid";

export function Default() {
  return <Pill>Pill</Pill>;
}

export function Shades() {
  return (
    <Box flexDirection="row" flexWrap="wrap" gap="1x">
      {(["gray", "blue", "green", "red", "yellow", "purple"] as const).map((shade) => (
        <Pill key={shade} shade={shade}>{shade}</Pill>
      ))}
    </Box>
  );
}

export function Intensities() {
  return (
    <Box flexDirection="row" flexWrap="wrap" gap="1x">
      {(["extraLight", "light", "bold", "extraBold"] as const).map((intensity) => (
        <Pill key={intensity} shade="blue" intensity={intensity}>{intensity}</Pill>
      ))}
    </Box>
  );
}

export function Bordered() {
  return <Pill shade="green" bordered>Shipped</Pill>;
}

export function WithVisuals() {
  return (
    <Pill shade="blue" leadingVisual={<Icon name="tag" />} trailingVisual={<Icon name="close" />}>
      Label
    </Pill>
  );
}

export function InText() {
  return (
    <Text>
      Status <Pill shade="green" bordered>Shipped</Pill> and the line keeps its height.
    </Text>
  );
}
