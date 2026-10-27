import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Icon } from "../Icon";
import { Text } from "../Text";
import { SegmentedControl } from "./SegmentedControl";

const meta: Meta<typeof SegmentedControl> = {
  title: "Core/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    onValueChange: { action: "value changed" },
  },
};
export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Playground: Story = {
  args: { "aria-label": "View", defaultValue: "states", size: "sm" },
  render: (args) => (
    <SegmentedControl {...args}>
      <SegmentedControl.Item value="states">States</SegmentedControl.Item>
      <SegmentedControl.Item value="anatomy">Anatomy</SegmentedControl.Item>
      <SegmentedControl.Item value="playground">Playground</SegmentedControl.Item>
    </SegmentedControl>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Box gap="3x" alignItems="flex-start">
      {(["sm", "md", "lg"] as const).map((size) => (
        <SegmentedControl key={size} aria-label={`Size ${size}`} size={size} defaultValue="b">
          <SegmentedControl.Item value="a">First</SegmentedControl.Item>
          <SegmentedControl.Item value="b">Second</SegmentedControl.Item>
          <SegmentedControl.Item value="c">Third</SegmentedControl.Item>
        </SegmentedControl>
      ))}
    </Box>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <SegmentedControl aria-label="Layout" defaultValue="list">
      <SegmentedControl.Item value="list" leadingVisual={<Icon name="list" />}>
        List
      </SegmentedControl.Item>
      <SegmentedControl.Item value="grid" leadingVisual={<Icon name="grid_view" />}>
        Grid
      </SegmentedControl.Item>
      <SegmentedControl.Item value="table" trailingVisual={<Icon name="table_rows" />}>
        Table
      </SegmentedControl.Item>
    </SegmentedControl>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <SegmentedControl aria-label="Layout" defaultValue="list">
      <SegmentedControl.Item value="list" aria-label="List" leadingVisual={<Icon name="list" />} />
      <SegmentedControl.Item value="grid" aria-label="Grid" leadingVisual={<Icon name="grid_view" />} />
    </SegmentedControl>
  ),
};

export const WithADisabledItem: Story = {
  render: () => (
    <SegmentedControl aria-label="View" defaultValue="states">
      <SegmentedControl.Item value="states">States</SegmentedControl.Item>
      <SegmentedControl.Item value="anatomy">Anatomy</SegmentedControl.Item>
      <SegmentedControl.Item value="example" disabled>
        Example
      </SegmentedControl.Item>
    </SegmentedControl>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState("week");
    return (
      <Box gap="2x" alignItems="flex-start">
        <SegmentedControl aria-label="Range" value={value} onValueChange={setValue}>
          <SegmentedControl.Item value="day">Day</SegmentedControl.Item>
          <SegmentedControl.Item value="week">Week</SegmentedControl.Item>
          <SegmentedControl.Item value="month">Month</SegmentedControl.Item>
        </SegmentedControl>
        <Text size="sm" color="neutral.muted">
          Showing a {value}.
        </Text>
      </Box>
    );
  },
};
