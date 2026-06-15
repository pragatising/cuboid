import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Box } from "./Box";
import { Stack } from "../Stack";
import { Text } from "../Text";

const meta: Meta<typeof Box> = {
  title: "Core/Box",
  component: Box,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Styled surface + flex layout — background, border, and radius from functional
            tokens; gap, padding, and direction from Stack.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Bordered panel</h3>
            <Box border="default" borderRadius="lg" background="default" padding="md" style={{ maxWidth: "24rem" }}>
              <Text variant="bodyMedium">
                Default background, default border, large radius.
              </Text>
            </Box>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof Box>;

export const Playground: Story = {
  args: {
    border: "default",
    borderRadius: "lg",
    background: "default",
    padding: "md",
    children: "Content",
  },
};

export const InsetSurface: Story = {
  render: () => (
    <Box border="muted" borderRadius="md" background="inset" padding="sm">
      <Text variant="bodySmall" color="text.muted">
        Inset background with muted border — similar to nested JSON rows.
      </Text>
    </Box>
  ),
};

export const HorizontalLayout: Story = {
  render: () => (
    <Box border="default" borderRadius="lg" background="default" padding="sm" direction="horizontal" gap="sm" align="center">
      <Box background="inset" borderRadius="sm" padding="xs">
        <Text variant="caption">A</Text>
      </Box>
      <Box background="inset" borderRadius="sm" padding="xs">
        <Text variant="caption">B</Text>
      </Box>
    </Box>
  ),
};

export const NestedInStack: Story = {
  render: () => (
    <Stack gap="md" style={{ maxWidth: "20rem" }}>
      <Text variant="titleSmall">API response</Text>
      <Box border="default" borderRadius="lg" overflow="hidden" direction="vertical" gap="none">
        <Box background="default" padding="sm">
          <Text variant="codeBlock" as="div">
            {'{ "status": "ok" }'}
          </Text>
        </Box>
      </Box>
    </Stack>
  ),
};
