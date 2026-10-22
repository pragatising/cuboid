import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "Core/Text",
  component: Text,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    weight: { control: "inline-radio", options: [undefined, "light", "normal", "medium", "semibold"] },
    whiteSpace: { control: "select", options: [undefined, "normal", "nowrap", "pre", "pre-wrap", "pre-line"] },
    color: { control: "select", options: [undefined, "neutral.default", "neutral.muted", "neutral.subtle", "neutral.contrast", "neutral.disabled", "success.strong", "danger.strong", "warning.strong", "informational.strong", "link.default"] },
  },
};
export default meta;
type Story = StoryObj<typeof Text>;

export const Playground: Story = {
  args: { children: "The quick brown fox jumps over the lazy dog." },
};

export const Sizes: Story = {
  render: () => (
    <Box gap="sm">
      <Text size="lg">Large — the quick brown fox jumps over the lazy dog.</Text>
      <Text size="lg">Medium — the quick brown fox jumps over the lazy dog.</Text>
      <Text size="md">Small — the quick brown fox jumps over the lazy dog.</Text>
    </Box>
  ),
};

export const Weights: Story = {
  render: () => (
    <Box gap="xs">
      <Text>Default — the weight from the size token</Text>
      {(["light", "normal", "medium", "semibold"] as const).map((weight) => (
        <Text key={weight} weight={weight}>
          weight=&quot;{weight}&quot;
        </Text>
      ))}
    </Box>
  ),
};

export const Colors: Story = {
  render: () => (
    <Box gap="xs">
      <Text>Default for Text (the text.fgColor token)</Text>
      {(["neutral.contrast", "neutral.default", "neutral.muted", "neutral.subtle", "neutral.disabled", "success.strong", "danger.strong", "warning.strong", "informational.strong", "link.default"] as const).map((color) => (
        <Text key={color} color={color}>
          color=&quot;{color}&quot;
        </Text>
      ))}
    </Box>
  ),
};

export const AsAnotherElement: Story = {
  name: "As another element",
  render: () => (
    <Text as="span">
      Rendered as a <code>span</code>.
    </Text>
  ),
};

export const Truncate: Story = {
  render: () => (
    <div style={{ maxWidth: "16rem" }}>
      <Text truncate>This sentence is far too long for the box it sits in, so it is cut off with an ellipsis.</Text>
    </div>
  ),
};

export const WhiteSpace: Story = {
  name: "White space",
  render: () => (
    <Box gap="sm">
      {(["normal", "nowrap", "pre", "pre-wrap", "pre-line"] as const).map((whiteSpace) => (
        <div key={whiteSpace} style={{ width: "14rem", border: "1px dashed currentColor", padding: "0.25rem" }}>
          <Text size="md" color="neutral.muted">{whiteSpace}</Text>
          <Text whiteSpace={whiteSpace}>{"Line one   with  extra  spaces\nLine two is quite a bit longer than the box"}</Text>
        </div>
      ))}
    </Box>
  ),
};
