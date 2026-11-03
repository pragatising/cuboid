import { Box, Divider, Text } from "@sragatiping/cuboid";

export function Default() {
  return (
    <Box gap="1x">
      <Text>Section above</Text>
      <Divider />
      <Text>Section below</Text>
    </Box>
  );
}

export function Muted() {
  return (
    <Box gap="1x">
      <Text>Section above</Text>
      <Divider color="muted" />
      <Text>Section below</Text>
    </Box>
  );
}
