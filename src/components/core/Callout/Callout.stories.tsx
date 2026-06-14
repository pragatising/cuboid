import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Callout } from "./Callout";
import { Stack } from "../Stack";
import { Text } from "../Text";

const meta: Meta<typeof Callout> = {
  title: "Core/Callout",
  component: Callout,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Inset block for blockquotes, notes, and asides. Background from{" "}
            <code>colors.functional.background.inset</code>; radius from{" "}
            <code>sizes.borderRadius.md</code>.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Blockquote</h3>
            <Stack gap="md" style={{ maxWidth: "36rem" }}>
              <Text variant="bodyMedium">
                Body copy can introduce a quoted or emphasized passage.
              </Text>
              <Callout>
                <Text variant="bodyMedium" color="muted">
                  Minimising back &amp; forth between stimulus, cognition and action.
                </Text>
              </Callout>
            </Stack>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
};

export default meta;
type Story = StoryObj<typeof Callout>;

export const Default: Story = {
  render: () => (
    <Callout style={{ maxWidth: "36rem" }}>
      <Text variant="bodyMedium" color="muted">
        A short note or pull quote set apart from the surrounding paragraph.
      </Text>
    </Callout>
  ),
};

export const InProse: Story = {
  name: "In prose",
  render: () => (
    <Stack gap="md" style={{ maxWidth: "36rem" }}>
      <Text variant="bodyMedium">
        T-shaped product designer, currently shaping data-intensive decision making — credit,
        verifications, underwriting, portfolio intelligence.
      </Text>
      <Callout>
        <Text variant="bodyMedium" color="muted">
          Shipping code as well as designing directly in codebase with real data, API design,
          designing AI native components.
        </Text>
      </Callout>
      <Text variant="bodyMedium">
        Previously at Amount, Stride Build, Georgia Tech, and PwC.
      </Text>
    </Stack>
  ),
};

export const Multiline: Story = {
  name: "Multiline",
  render: () => (
    <Callout style={{ maxWidth: "36rem" }}>
      <Stack gap="xs">
        <Text variant="bodyMedium" color="muted">
          Design approach spans systems thinking and craft at the interaction layer.
        </Text>
        <Text variant="caption" color="muted">
          Zoomed out: ecosystems and parts. Zoomed in: stimulus → cognition → action.
        </Text>
      </Stack>
    </Callout>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Callout {...args} style={{ maxWidth: "36rem" }}>
      <Text variant="bodyMedium" color="muted">
        Callout content goes here.
      </Text>
    </Callout>
  ),
};
