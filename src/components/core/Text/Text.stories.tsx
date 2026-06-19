import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "../../../theme/ThemeContext";
import { Stack } from "../Stack";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "Core/Text",
  component: Text,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Text>;

export const AllVariants: Story = {
  render: () => (
    <Stack gap="sm">
      <Text variant="display">Display</Text>
      <Text variant="titleLarge">Title Large</Text>
      <Text variant="titleMedium">Title Medium</Text>
      <Text variant="titleSmall">Title Small — sm / semibold / 1.5</Text>
      <Text variant="subtitle">Subtitle</Text>
      <Text variant="subheadXs">Subhead XS</Text>
      <Text variant="subheadSm">Subhead SM</Text>
      <Text variant="subheadMd">Subhead MD</Text>
      <Text variant="bodyLarge">Body Large</Text>
      <Text variant="bodyMedium">Body Medium</Text>
      <Text variant="bodyStrong">Body Strong</Text>
      <Text variant="bodySmall">Body Small</Text>
      <Text variant="caption">Caption</Text>
      <Text variant="codeBlock">{"const x = { key: 'value' };"}</Text>
      <Text variant="inlineCode">inline code</Text>
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => {
    const tokens = useTheme();
    return (
      <Stack gap="xs">
        <Text color="default">default — primary reading text (fg.neutral.muted)</Text>
        <Text color="muted">muted — secondary text (text.default)</Text>
        <Text color="text.muted">text.muted — explicit global path</Text>
        <Text color="disabled">disabled — unavailable state</Text>
        <Text color="link">link — interactive text</Text>
        <Text color="neutral">neutral — label / meta text</Text>
        <Text color="fg.blue.3">fg.blue.3 — global foreground scale</Text>
        {/* background.emphasis is the dark surface — text must be onEmphasis */}
        <div
          style={{
            background: tokens.colors.functional.background.emphasis,
            padding: tokens.sizes.space[3],
            borderRadius: tokens.sizes.borderRadius.md,
          }}
        >
          <Text color="onEmphasis">onEmphasis — text on dark backgrounds</Text>
        </div>
      </Stack>
    );
  },
};

export const Truncate: Story = {
  render: () => (
    <Text truncate style={{ maxWidth: "12.5rem" }}>
      This text is very long and will be truncated with an ellipsis when it overflows.
    </Text>
  ),
};
