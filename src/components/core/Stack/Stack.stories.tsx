import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "../../../theme/ThemeContext";
import { Stack } from "./Stack";

/** Demo box that reads all its visual values from the theme */
function Box({ label }: { label: string }) {
  const tokens = useTheme();
  return (
    <div
      style={{
        background: tokens.colors.functional.background.muted,
        border: `${tokens.sizes.borderWidth.thin} solid ${tokens.colors.functional.border.default}`,
        borderRadius: tokens.sizes.borderRadius.md,
        padding: `${tokens.sizes.space[2]} ${tokens.sizes.space[3]}`,
        fontSize: tokens.typography.text.bodySmall.fontSize,
        color: tokens.colors.functional.foreground.default,
      }}
    >
      {label}
    </div>
  );
}

const meta: Meta<typeof Stack> = {
  title: "Core/Stack",
  component: Stack,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Stack>;

export const Vertical: Story = {
  render: () => (
    <Stack gap={3}>
      <Box label="Item 1" />
      <Box label="Item 2" />
      <Box label="Item 3" />
    </Stack>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Stack direction="horizontal" gap={3} align="center">
      <Box label="Left" />
      <Box label="Center" />
      <Box label="Right" />
    </Stack>
  ),
};

export const SpaceBetween: Story = {
  render: () => (
    <Stack direction="horizontal" justify="space-between" align="center">
      <Box label="Leading" />
      <Box label="Trailing" />
    </Stack>
  ),
};

export const WithPadding: Story = {
  render: () => {
    const tokens = useTheme();
    return (
      <Stack
        gap={4}
        padding={5}
        style={{
          background: tokens.colors.functional.background.muted,
          borderRadius: tokens.sizes.borderRadius.lg,
          border: `${tokens.sizes.borderWidth.thin} solid ${tokens.colors.functional.border.default}`,
        }}
      >
        <Box label="Padded item A" />
        <Box label="Padded item B" />
      </Stack>
    );
  },
};

export const Wrap: Story = {
  render: () => (
    <Stack direction="horizontal" gap={2} wrap style={{ maxWidth: "18.75rem" }}>
      {["One", "Two", "Three", "Four", "Five", "Six"].map((l) => (
        <Box key={l} label={l} />
      ))}
    </Stack>
  ),
};
