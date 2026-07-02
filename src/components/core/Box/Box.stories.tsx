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
            Styled surface + flex layout — colors from global token paths; gap,
            padding, and direction from Stack.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Bordered panel</h3>
            <Box
              borderColor="border.gray.2"
              borderRadius="lg"
              background="bg.gray.light.1"
              padding="md"
              style={{ maxWidth: "24rem" }}
            >
              <Text role="body" size="sm">
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
    borderColor: "border.gray.2",
    borderRadius: "lg",
    background: "bg.gray.light.1",
    padding: "md",
    children: "Content",
  },
};

export const InsetSurface: Story = {
  render: () => (
    <Box
      borderColor="border.grayAlpha.2"
      borderRadius="md"
      background="canvas.inset"
      padding="sm"
    >
      <Text role="body" size="xs" color="text.muted">
        Inset background with muted border — similar to nested JSON rows.
      </Text>
    </Box>
  ),
};

export const HorizontalLayout: Story = {
  render: () => (
    <Box
      borderColor="border.gray.2"
      borderRadius="lg"
      background="bg.gray.light.1"
      padding="sm"
      direction="horizontal"
      gap="sm"
      align="center"
    >
      <Box background="canvas.inset" borderRadius="sm" padding="xs">
        <Text role="body" size="xs">A</Text>
      </Box>
      <Box background="canvas.inset" borderRadius="sm" padding="xs">
        <Text role="body" size="xs">B</Text>
      </Box>
    </Box>
  ),
};

export const NestedInStack: Story = {
  render: () => (
    <Stack gap="md" style={{ maxWidth: "20rem" }}>
      <Text role="heading" size="sm">API response</Text>
      <Box
        borderColor="border.gray.2"
        borderRadius="lg"
        overflow="hidden"
        direction="vertical"
        gap="none"
      >
        <Box background="bg.gray.light.1" padding="sm">
          <Text role="code" code="block" as="div">
            {'{ "status": "ok" }'}
          </Text>
        </Box>
      </Box>
    </Stack>
  ),
};
