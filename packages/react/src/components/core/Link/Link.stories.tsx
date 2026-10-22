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
    size: { control: "inline-radio", options: [undefined, "sm", "md", "lg"] },
    weight: { control: "select", options: [undefined, "light", "normal", "medium", "semibold"] },
    underline: { control: "inline-radio", options: [undefined, "always", "hover", "none"] },
    color: { control: "text" },
    inactive: { control: "boolean" },
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

export const Sizes: Story = {
  name: "Sizes (the same as Text)",
  render: () => (
    <Box flexDirection="row" alignItems="center" gap="3x">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Link key={size} href="#" size={size}>size {size}</Link>
      ))}
    </Box>
  ),
};

export const Weights: Story = {
  render: () => (
    <Box flexDirection="row" alignItems="center" gap="3x">
      {(["light", "normal", "medium", "semibold"] as const).map((weight) => (
        <Link key={weight} href="#" weight={weight}>{weight}</Link>
      ))}
    </Box>
  ),
};

export const Underline: Story = {
  render: () => (
    <Box flexDirection="row" alignItems="center" gap="3x">
      {(["always", "hover", "none"] as const).map((underline) => (
        <Link key={underline} href="#" underline={underline}>underline: {underline}</Link>
      ))}
    </Box>
  ),
};

export const Color: Story = {
  name: "Color (a token or any CSS colour)",
  render: () => (
    <Box flexDirection="row" alignItems="center" gap="3x">
      <Link href="#">default (link tokens)</Link>
      <Link href="#" color="neutral.muted">neutral.muted</Link>
      <Link href="#" color="success.strong">success.strong</Link>
      <Link href="#" color="#e01280">#e01280</Link>
      <Link href="#" variant="inherit" color="rebeccapurple">inherit + rebeccapurple</Link>
    </Box>
  ),
};

export const Inactive: Story = {
  render: () => (
    <Box flexDirection="row" alignItems="center" gap="3x">
      <Link href="#">active</Link>
      <Link href="#" inactive>inactive (focusable, ignores clicks)</Link>
    </Box>
  ),
};
