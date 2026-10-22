import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "../Heading";
import { Box } from "../Box";
import { Subtitle } from "./Subtitle";

const meta: Meta<typeof Subtitle> = {
  title: "Core/Subtitle",
  component: Subtitle,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    color: { control: "select", options: [undefined, "neutral.contrast", "neutral.muted", "success.strong", "danger.strong"] },
  },
};
export default meta;
type Story = StoryObj<typeof Subtitle>;

export const Playground: Story = {
  args: { children: "Supporting text that describes the page." },
};

export const UnderAHeading: Story = {
  name: "Under a heading",
  render: () => (
    <Box gap="xxs">
      <Heading as="h1">Billing</Heading>
      <Subtitle>Manage your plan, payment methods and invoices.</Subtitle>
    </Box>
  ),
};

export const Colors: Story = {
  render: () => (
    <Box gap="xs">
      <Subtitle>Default colour</Subtitle>
      {(["neutral.contrast", "success.strong", "danger.strong"] as const).map((color) => (
        <Subtitle key={color} color={color}>
          color=&quot;{color}&quot;
        </Subtitle>
      ))}
    </Box>
  ),
};
