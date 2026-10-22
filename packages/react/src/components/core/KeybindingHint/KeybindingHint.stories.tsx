import type { Meta, StoryObj } from "@storybook/react";
import { PlatformProvider } from "../../../behaviors";
import type { Platform } from "../../../behaviors";
import { Box } from "../Box";
import { Text } from "../Text";
import { KeybindingHint } from "./KeybindingHint";

const meta: Meta<typeof KeybindingHint> = {
  title: "Core/KeybindingHint",
  component: KeybindingHint,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    keys: { control: "text" },
    format: { control: "inline-radio", options: ["condensed", "full"] },
    variant: { control: "inline-radio", options: ["normal", "inverted"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
};
export default meta;
type Story = StoryObj<typeof KeybindingHint>;

export const Playground: Story = { args: { keys: "Mod+Shift+K" } };

export const Platforms: Story = {
  name: "Names follow the platform (keys written once)",
  render: () => (
    <Box gap="1x">
      {(["apple", "windows", "other"] as Platform[]).map((platform) => (
        <Box key={platform} flexDirection="row" alignItems="center" gap="2x">
          <Text size="sm" color="neutral.muted" style={{ width: "5rem" }}>{platform}</Text>
          <PlatformProvider value={platform}>
            <KeybindingHint keys="Mod+Shift+K" />
            <KeybindingHint keys="Alt+Enter" />
            <KeybindingHint keys="Meta+ArrowUp" />
          </PlatformProvider>
        </Box>
      ))}
    </Box>
  ),
};

export const Formats: Story = {
  render: () => (
    <Box gap="1x">
      <Box flexDirection="row" gap="2x" alignItems="center"><Text size="sm" color="neutral.muted">condensed</Text><KeybindingHint keys="Mod+Shift+K" /></Box>
      <Box flexDirection="row" gap="2x" alignItems="center"><Text size="sm" color="neutral.muted">full</Text><KeybindingHint keys="Mod+Shift+K" format="full" /></Box>
    </Box>
  ),
};

export const Sequences: Story = {
  render: () => (
    <Box gap="1x">
      <KeybindingHint keys="g i" />
      <KeybindingHint keys="Mod+K Mod+S" />
    </Box>
  ),
};

export const Variants: Story = {
  name: "Variants and sizes",
  render: () => (
    <Box gap="1x">
      <Box flexDirection="row" gap="2x" alignItems="center"><KeybindingHint keys="Mod+S" size="sm" /><KeybindingHint keys="Mod+S" size="md" /></Box>
      <Box flexDirection="row" gap="2x" alignItems="center" backgroundColor="neutral.inverted.1" padding="1x" borderRadius="sm" width="fit-content">
        <KeybindingHint keys="Mod+S" variant="inverted" size="sm" />
        <KeybindingHint keys="Mod+S" variant="inverted" size="md" />
      </Box>
    </Box>
  ),
};

export const InProse: Story = {
  name: "In a sentence",
  render: () => (
    <Text>
      Search anything with <KeybindingHint keys="Mod+K" format="full" /> or jump to the inbox with <KeybindingHint keys="g i" />.
    </Text>
  ),
};
