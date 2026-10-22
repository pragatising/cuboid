import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import tokens from "@sragatiping/cuboid-primitives";
import { Box } from "../Box";
import { Icon } from "../Icon";
import { Text } from "../Text";
import { Pill, type PillIntensity, type PillShade } from "./Pill";

const SHADES = Object.keys(tokens.light.pill.color) as PillShade[];
const INTENSITIES = Object.keys(tokens.light.pill.color.gray) as PillIntensity[];

function IntensityMatrix({ bordered = false }: { bordered?: boolean }) {
  return (
    <Box gap="1x">
      {INTENSITIES.map((intensity) => (
        <Box key={intensity} flexDirection="row" flexWrap="wrap" alignItems="center" gap="1x">
          <Text size="sm" style={{ width: "6rem" }}>{intensity}</Text>
          {SHADES.map((shade) => (
            <Pill key={shade} shade={shade} intensity={intensity} bordered={bordered}>
              {shade}
            </Pill>
          ))}
        </Box>
      ))}
    </Box>
  );
}

const meta: Meta<typeof Pill> = {
  title: "Core/Pill",
  component: Pill,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    shade: { control: "select", options: SHADES },
    intensity: { control: "select", options: INTENSITIES },
    bordered: { control: "boolean" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
};
export default meta;
type Story = StoryObj<typeof Pill>;

export const Playground: Story = {
  args: { shade: "gray", intensity: "light", bordered: false, size: "sm", children: "Pill" },
};

export const AllVariantsFilled: Story = {
  name: "All variants (filled)",
  render: () => <IntensityMatrix />,
};

export const AllVariantsBordered: Story = {
  name: "All variants (bordered)",
  render: () => <IntensityMatrix bordered />,
};

export const Sizes: Story = {
  name: "Sizes (label font; height stays fixed)",
  render: () => (
    <Box flexDirection="row" alignItems="center" gap="1x">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Pill key={size} size={size} bordered>
          {size}
        </Pill>
      ))}
    </Box>
  ),
};

export const WithVisuals: Story = {
  name: "Leading and trailing visuals",
  render: () => (
    <Box flexDirection="row" alignItems="center" gap="1x">
      <Pill shade="green" leadingVisual={<Icon name="check_circle" size="xs" />}>
        Passed
      </Pill>
      <Pill shade="red" trailingVisual={<Icon name="close" size="xs" />}>
        Remove
      </Pill>
    </Box>
  ),
};

export const AsLink: Story = {
  name: "As a link",
  render: () => (
    <Pill as="a" href="https://example.com" trailingVisual={<Icon name="open_in_new" size="xs" />}>
      Documentation
    </Pill>
  ),
};
