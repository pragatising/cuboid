import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Core/Button",
  component: Button,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Sizes: Story = {
  render: () => (
    <Stack gap={5}>
      <Text variant="titleSmall">Sizes</Text>
      <Stack direction="horizontal" gap={3} align="center">
        <Button size="sm">Small — 24px</Button>
        <Button size="md">Medium — 32px</Button>
        <Button size="lg">Large — 40px</Button>
      </Stack>
    </Stack>
  ),
};

export const Variants: Story = {
  render: () => (
    <Stack gap={5}>
      <Text variant="titleSmall">Variants (md size)</Text>
      <Stack direction="horizontal" gap={3} align="center">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </Stack>
    </Stack>
  ),
};

export const AllSizesAllVariants: Story = {
  render: () => (
    <Stack gap={6}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Stack key={size} gap={3}>
          <Text variant="caption" color="muted">{size.toUpperCase()}</Text>
          <Stack direction="horizontal" gap={3} align="center">
            <Button size={size} variant="primary">Primary</Button>
            <Button size={size} variant="secondary">Secondary</Button>
            <Button size={size} variant="ghost">Ghost</Button>
            <Button size={size} variant="danger">Danger</Button>
          </Stack>
        </Stack>
      ))}
    </Stack>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Stack direction="horizontal" gap={3} align="center">
      <Button
        size="md"
        variant="primary"
        leadingIcon={<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" /></svg>}
      >
        Add item
      </Button>
      <Button
        size="md"
        variant="secondary"
        trailingIcon={<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.427 9.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 9H4.604a.25.25 0 0 0-.177.427z" /></svg>}
      >
        Dropdown
      </Button>
    </Stack>
  ),
};

export const DisabledState: Story = {
  render: () => (
    <Stack direction="horizontal" gap={3} align="center">
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="ghost" disabled>Ghost</Button>
    </Stack>
  ),
};
