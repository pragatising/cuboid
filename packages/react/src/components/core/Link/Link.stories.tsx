import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Text } from "../Text";
import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  title: "Core/Link",
  component: Link,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    variant: { control: "radio", options: ["inline", "standalone", "inherit"] },
    external: { control: "boolean" },
    showExternalIcon: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof Link>;

export const Playground: Story = {
  args: { href: "https://example.com", variant: "standalone", external: false, children: "Link label" },
};

export const Inline: Story = {
  name: "Inline (in prose)",
  render: () => (
    <Text>
      Read the{" "}
      <Link href="#getting-started" variant="inline">
        getting started guide
      </Link>{" "}
      for setup steps, or browse the component API reference.
    </Text>
  ),
};

export const Standalone: Story = {
  render: () => (
    <Box gap="0.5x">
      <Link href="mailto:hello@example.com">support@example.com</Link>
      <Link href="https://example.com" external>
        Documentation
      </Link>
    </Box>
  ),
};

export const External: Story = {
  name: "External without the icon",
  render: () => (
    <Link href="https://example.com" external showExternalIcon={false}>
      Opens in a new tab
    </Link>
  ),
};

export const Inherit: Story = {
  name: "Inherit (no link chrome)",
  render: () => (
    <Link href="#" variant="inherit">
      Wraps other content without underline or colour
    </Link>
  ),
};
