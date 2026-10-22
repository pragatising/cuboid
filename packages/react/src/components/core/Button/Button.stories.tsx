import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Text } from "../Text";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Core/Button",
  component: Button,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost", "danger", "rounded"] },
    size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] },
    alignContent: { control: "inline-radio", options: ["center", "start"] },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" focusable="false">
    <path d="M7.25 2.5a.75.75 0 0 1 1.5 0v4.75h4.75a.75.75 0 0 1 0 1.5H8.75v4.75a.75.75 0 0 1-1.5 0V8.75H2.5a.75.75 0 0 1 0-1.5h4.75Z" />
  </svg>
);
const ChevronIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" focusable="false">
    <path d="M4.47 5.97a.75.75 0 0 1 1.06 0L8 8.44l2.47-2.47a.75.75 0 1 1 1.06 1.06L8.53 10.03a.75.75 0 0 1-1.06 0L4.47 7.03a.75.75 0 0 1 0-1.06Z" />
  </svg>
);

export const Playground: Story = {
  args: { children: "Button", variant: "secondary", size: "sm" },
};

export const Variants: Story = {
  render: () => (
    <Box flexDirection="row" gap="1x" flexWrap="wrap" alignItems="center">
      {(["primary", "secondary", "ghost", "danger", "rounded"] as const).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </Box>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Box flexDirection="row" gap="1x" flexWrap="wrap" alignItems="center">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Button key={size} variant="primary" size={size}>
          Size {size}
        </Button>
      ))}
    </Box>
  ),
};

export const States: Story = {
  render: () => (
    <Box gap="1x">
      <Text size="sm" color="neutral.muted">Hover, press and tab to each; the last of each row is disabled.</Text>
      {(["primary", "secondary", "ghost", "danger", "rounded"] as const).map((variant) => (
        <Box key={variant} flexDirection="row" gap="1x" alignItems="center">
          <Button variant={variant}>{variant}</Button>
          <Button variant={variant} disabled>
            {variant} (disabled)
          </Button>
        </Box>
      ))}
    </Box>
  ),
};

export const Visuals: Story = {
  render: () => (
    <Box flexDirection="row" gap="1x" flexWrap="wrap" alignItems="center">
      <Button variant="primary" leadingVisual={<PlusIcon />}>Leading visual</Button>
      <Button trailingVisual={<ChevronIcon />}>Trailing visual</Button>
      <Button variant="primary" size="lg" leadingVisual={<PlusIcon />} trailingVisual={<ChevronIcon />}>Both</Button>
    </Box>
  ),
};

export const Loading: Story = {
  render: () => (
    <Box gap="1x">
      <Text size="sm" color="neutral.muted">
        Loading shows a spinner in place of the leading visual (or beside the label when there is none), ignores activation, stays
        focusable, and announces `loadingMessage` to screen readers.
      </Text>
      <Box flexDirection="row" gap="1x" flexWrap="wrap" alignItems="center">
        <Button variant="primary" loading>Saving</Button>
        <Button variant="primary" loading leadingVisual={<PlusIcon />}>Replaces the leading visual</Button>
        <Button loading trailingVisual={<ChevronIcon />} loadingMessage="Loading options">Replaces the trailing visual</Button>
      </Box>
    </Box>
  ),
};

export const Inactive: Story = {
  render: () => (
    <Box flexDirection="row" gap="1x" flexWrap="wrap" alignItems="center">
      <Button variant="primary" inactive>Inactive</Button>
      <Button variant="primary" disabled>Disabled</Button>
      <Text size="sm" color="neutral.muted">Inactive looks disabled but stays focusable: tab to it.</Text>
    </Box>
  ),
};

export const AlignContent: Story = {
  name: "Align content",
  render: () => (
    <Box width="20rem" gap="1x">
      <Button block leadingVisual={<PlusIcon />}>Centered (default)</Button>
      <Button block alignContent="start" leadingVisual={<PlusIcon />}>Start</Button>
    </Box>
  ),
};

export const RoundedVariant: Story = {
  name: "Rounded variant",
  render: () => (
    <Box flexDirection="row" gap="1x" flexWrap="wrap" alignItems="center">
      <Button variant="rounded">rounded</Button>
      <Button variant="rounded" size="lg" leadingVisual={<PlusIcon />}>rounded large</Button>
    </Box>
  ),
};

export const Block: Story = {
  render: () => (
    <Box width="20rem" gap="1x">
      <Button variant="primary" block>Block button</Button>
      <Button block>Block button</Button>
    </Box>
  ),
};
