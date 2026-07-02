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
      <Text role="heading" size="xl">
        Heading XL
      </Text>
      <Text role="heading" size="lg">
        Heading LG
      </Text>
      <Text role="heading" size="md">
        Heading MD
      </Text>
      <Text role="heading" size="sm">
        Heading SM
      </Text>
      <Text role="subhead" size="md">
        Subhead MD
      </Text>
      <Text role="subhead" size="sm">
        Subhead SM
      </Text>
      <Text role="subhead" size="xs">
        Subhead XS
      </Text>
      <Text role="body" size="lg">
        Body LG
      </Text>
      <Text role="body" size="md">
        Body MD
      </Text>
      <Text role="body" size="sm">
        Body SM
      </Text>
      <Text role="body" size="sm" weight="semibold">
        Body SM semibold (weight prop)
      </Text>
      <Text role="body" size="sm" weight="medium">
        Body SM medium (500)
      </Text>
      <Text role="body" size="xs">
        Body XS
      </Text>
      <Text role="code" code="block">
        {"const x = { key: 'value' };"}
      </Text>
      <Text role="code" code="inline">
        inline code
      </Text>
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
        <div
          style={{
            background: tokens.colors.global.bg.gray.dark["7"],
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
