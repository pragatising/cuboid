import { Box, TileIcon } from "@sragatiping/cuboid";

export function Default() {
  return <TileIcon name="folder" />;
}

export function Sizes() {
  return (
    <Box flexDirection="row" alignItems="center" gap="2x">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <TileIcon key={size} name="folder" size={size} />
      ))}
    </Box>
  );
}

export function Colours() {
  return (
    <Box flexDirection="row" gap="2x">
      <TileIcon name="check" backgroundColor="success.subtle" color="success.strong" />
      <TileIcon name="info" backgroundColor="informational.subtle" color="informational.strong" />
      <TileIcon name="warning" backgroundColor="warning.subtle" color="warning.strong" />
      <TileIcon name="error" backgroundColor="danger.subtle" color="danger.strong" />
    </Box>
  );
}
