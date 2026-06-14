import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import type { HighlightColor } from "../../../theme/types";
import { Highlight } from "./Highlight";
import { Text } from "../Text";

const HIGHLIGHT_COLORS: HighlightColor[] = [
  "none",
  "green",
  "blue",
  "yellow",
  "orange",
  "red",
  "neutral",
];

const meta: Meta<typeof Highlight> = {
  title: "Core/Highlight",
  component: Highlight,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Inline marker text from Figma <code>HighlightedText</code> — token colors from{" "}
            <code>color.highlight.*</code>. Inherits font from parent; use inside{" "}
            <code>Text</code> body copy.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">In prose</h3>
            <Text variant="bodyMedium">
              T-shaped designer working on{" "}
              <Highlight color="yellow">credit and underwriting</Highlight> at FIS.
            </Text>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
  argTypes: {
    color: { control: "select", options: HIGHLIGHT_COLORS },
  },
};

export default meta;
type Story = StoryObj<typeof Highlight>;

export const Default: Story = {
  args: {
    color: "yellow",
    children: "text",
  },
};

export const AllColors: Story = {
  render: () => (
    <Text variant="bodyMedium">
      {HIGHLIGHT_COLORS.map((color) => (
        <React.Fragment key={color}>
          <Highlight color={color}>text</Highlight>{" "}
        </React.Fragment>
      ))}
    </Text>
  ),
};

export const InSentence: Story = {
  render: () => (
    <Text variant="bodyMedium">
      Previously at <Highlight color="neutral">Amount</Highlight>, building{" "}
      <Highlight color="blue">portfolio intelligence</Highlight> workflows.
    </Text>
  ),
};
