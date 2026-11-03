import { Box, KeybindingHint } from "@sragatiping/cuboid";

export function Default() {
  return <KeybindingHint keys="Mod+Shift+K" />;
}

export function Formats() {
  return (
    <Box gap="1x">
      <KeybindingHint keys="Mod+Shift+K" format="condensed" />
      <KeybindingHint keys="Mod+Shift+K" format="full" />
    </Box>
  );
}

export function Sequence() {
  return (
    <Box gap="1x">
      <KeybindingHint keys="g i" />
      <KeybindingHint keys="Mod+K Mod+S" />
    </Box>
  );
}

export function Sizes() {
  return (
    <Box flexDirection="row" alignItems="center" gap="2x">
      <KeybindingHint keys="Mod+S" size="sm" />
      <KeybindingHint keys="Mod+S" size="md" />
    </Box>
  );
}

export function Inverted() {
  return (
    <Box flexDirection="row" gap="1x" padding="1x" borderRadius="sm" backgroundColor="neutral.inverted.1" width="fit-content">
      <KeybindingHint keys="Mod+S" variant="inverted" />
    </Box>
  );
}
