import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import tokens from "@sragatiping/cuboid-primitives";
import { Highlight, type HighlightColor } from "./Highlight";
import { Text } from "../Text";

const HIGHLIGHT_COLORS = Object.entries(tokens.light.highlight)
  .filter(([, value]) => typeof value === "object")
  .map(([key]) => key) as HighlightColor[];

const meta: Meta<typeof Highlight> = {
  title: "Core/Highlight",
  component: Highlight,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    color: { control: "select", options: HIGHLIGHT_COLORS },
  },
};
export default meta;
type Story = StoryObj<typeof Highlight>;

export const Default: Story = {
  args: { color: "yellow", children: "text" },
};

export const AllColors: Story = {
  render: () => (
    <Text>
      {HIGHLIGHT_COLORS.map((color) => (
        <React.Fragment key={color}>
          <Highlight color={color}>{color}</Highlight>{" "}
        </React.Fragment>
      ))}
    </Text>
  ),
};

export const InSentence: Story = {
  render: () => (
    <Text>
      Previously at <Highlight color="neutral">Acme Inc</Highlight>, building{" "}
      <Highlight color="blue">search infrastructure</Highlight> workflows.
    </Text>
  ),
};
