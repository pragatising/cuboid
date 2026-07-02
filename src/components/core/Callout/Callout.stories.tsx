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
            <code>colors.global</code> (default <code>canvas.inset</code>); radius from{" "}
            <code>sizes.borderRadius.md</code>.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Blockquote</h3>
            <Stack gap="md" style={{ maxWidth: "36rem" }}>
              <Text role="body" size="sm">
                Body copy can introduce a quoted or emphasized passage.
              </Text>
              <Callout>
                <Text role="body" size="sm" color="muted">
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
  argTypes: {
    background: {
      control: "select",
      options: [
        "canvas.inset",
        "canvas.subtle",
        "bg.gray.light.2",
        "bg.gray.dark.7",
        "inset",
        "muted",
        "emphasis",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Callout>;

export const Default: Story = {
  render: () => (
    <Callout style={{ maxWidth: "36rem" }}>
      <Text role="body" size="sm" color="muted">
        A short note or pull quote set apart from the surrounding paragraph.
      </Text>
    </Callout>
  ),
};

export const InProse: Story = {
  name: "In prose",
  render: () => (
    <Stack gap="md" style={{ maxWidth: "36rem" }}>
      <Text role="body" size="sm">
        T-shaped product designer, currently shaping data-intensive decision making — credit,
        verifications, underwriting, portfolio intelligence.
      </Text>
      <Callout>
        <Text role="body" size="sm" color="muted">
          Shipping code as well as designing directly in codebase with real data, API design,
          designing AI native components.
        </Text>
      </Callout>
      <Text role="body" size="sm">
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
        <Text role="body" size="sm" color="muted">
          Design approach spans systems thinking and craft at the interaction layer.
        </Text>
        <Text role="body" size="xs" color="muted">
          Zoomed out: ecosystems and parts. Zoomed in: stimulus → cognition → action.
        </Text>
      </Stack>
    </Callout>
  ),
};

export const MutedSurface: Story = {
  name: "Muted background",
  render: () => (
    <Callout background="bg.gray.light.2" style={{ maxWidth: "36rem" }}>
      <Text role="body" size="sm" color="text.muted">
        Uses <code>background=&quot;bg.gray.light.2&quot;</code> instead of the default inset.
      </Text>
    </Callout>
  ),
};

export const Playground: Story = {
  args: {
    background: "canvas.inset",
  },
  render: (args) => (
    <Callout {...args} style={{ maxWidth: "36rem" }}>
      <Text role="body" size="sm" color="muted">
        Callout content goes here.
      </Text>
    </Callout>
  ),
};
