import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "../Text";
import { Box } from "./Box";

const meta: Meta<typeof Box> = {
  title: "Core/Box",
  component: Box,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    flexDirection: { control: "inline-radio", options: ["column", "row", "column-reverse", "row-reverse"] },
    alignItems: { control: "select", options: [undefined, "flex-start", "center", "flex-end", "stretch", "baseline"] },
    justifyContent: { control: "select", options: [undefined, "flex-start", "center", "flex-end", "space-between", "space-around"] },
    flexWrap: { control: "inline-radio", options: [undefined, "nowrap", "wrap", "wrap-reverse"] },
    display: { control: "select", options: [undefined, "flex", "inline-flex", "grid", "block"] },
  },
};
export default meta;
type Story = StoryObj<typeof Box>;

const Cell = ({ children }: { children: React.ReactNode }) => (
  <Box backgroundColor="canvas.insetStrong" borderRadius="sm" padding={{ block: "0.5x", inline: "1x" }}>
    <Text size="sm">{children}</Text>
  </Box>
);

export const Playground: Story = {
  args: { gap: "1x", padding: "2x", backgroundColor: "canvas.inset", borderRadius: "md" },
  render: (args) => (
    <Box {...args}>
      <Cell>One</Cell>
      <Cell>Two</Cell>
      <Cell>Three</Cell>
    </Box>
  ),
};

export const FlexDirection: Story = {
  name: "Flex direction (default: column)",
  render: () => (
    <Box gap="2x">
      <Box gap="1x">
        <Text size="sm" color="neutral.muted">column (default)</Text>
        <Box gap="0.5x"><Cell>A</Cell><Cell>B</Cell><Cell>C</Cell></Box>
      </Box>
      <Box gap="1x">
        <Text size="sm" color="neutral.muted">flexDirection=&quot;row&quot;</Text>
        <Box flexDirection="row" gap="0.5x"><Cell>A</Cell><Cell>B</Cell><Cell>C</Cell></Box>
      </Box>
    </Box>
  ),
};

export const AlignmentAndWrap: Story = {
  name: "Alignment and wrap",
  render: () => (
    <Box gap="2x">
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" padding="1x" borderColor="subtle" borderRadius="sm">
        <Cell>space-between</Cell>
        <Cell>and</Cell>
        <Cell>centred</Cell>
      </Box>
      <Box flexDirection="row" flexWrap="wrap" gap="1x" width="16rem" padding="1x" borderColor="subtle" borderRadius="sm">
        {["one", "two", "three", "four", "five", "six"].map((n) => <Cell key={n}>{n}</Cell>)}
      </Box>
    </Box>
  ),
};

export const Spacing: Story = {
  name: "Spacing (Nx scale and semantic)",
  render: () => (
    <Box gap="2x">
      <Box flexDirection="row" gap="1x" alignItems="flex-start">
        {(["0.5x", "1x", "2x", "3x"] as const).map((gap) => (
          <Box key={gap} gap={gap} padding="1x" borderColor="default" borderRadius="sm">
            <Text size="sm" color="neutral.muted">gap=&quot;{gap}&quot;</Text>
            <Cell>A</Cell><Cell>B</Cell>
          </Box>
        ))}
      </Box>
      <Box flexDirection="row" gap="1x" alignItems="flex-start">
        {(["xs", "sm", "md", "lg"] as const).map((gap) => (
          <Box key={gap} gap={gap} padding="1x" borderColor="default" borderRadius="sm">
            <Text size="sm" color="neutral.muted">gap=&quot;{gap}&quot;</Text>
            <Cell>A</Cell><Cell>B</Cell>
          </Box>
        ))}
      </Box>
    </Box>
  ),
};

export const PaddingShapes: Story = {
  name: "Padding shapes",
  render: () => (
    <Box flexDirection="row" gap="2x" alignItems="flex-start">
      <Box padding="2x" backgroundColor="canvas.inset" borderRadius="sm"><Text size="sm">padding=&quot;2x&quot;</Text></Box>
      <Box padding={{ block: "1x", inline: "3x" }} backgroundColor="canvas.inset" borderRadius="sm"><Text size="sm">block 1x, inline 3x</Text></Box>
      <Box padding={{ top: "0.5x", left: "3x", bottom: "2x" }} backgroundColor="canvas.inset" borderRadius="sm"><Text size="sm">top, left, bottom</Text></Box>
    </Box>
  ),
};

export const ColorsAndRadius: Story = {
  name: "Colours and radius",
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="1x">
      {(["none", "xs", "sm", "md", "lg", "xl", "full"] as const).map((borderRadius) => (
        <Box key={borderRadius} padding="2x" backgroundColor="canvas.inset" borderColor="default" borderRadius={borderRadius}>
          <Text size="sm">{borderRadius}</Text>
        </Box>
      ))}
      <Box padding="2x" backgroundColor="danger.subtle" color="danger.strong" borderRadius="md"><Text size="sm">danger tones</Text></Box>
      <Box padding="2x" backgroundColor="success.subtle" color="success.strong" borderRadius="md"><Text size="sm">success tones</Text></Box>
    </Box>
  ),
};

export const Position: Story = {
  render: () => (
    <Box position="relative" height="8rem" backgroundColor="canvas.inset" borderRadius="md">
      <Box position="absolute" top="1x" left="1x"><Cell>top-left</Cell></Box>
      <Box position="absolute" bottom="1x" right="1x"><Cell>bottom-right</Cell></Box>
      <Box position="absolute" inset={{ inline: "6x" }} top="3x"><Cell>inset inline 6x</Cell></Box>
    </Box>
  ),
};

export const AsAnotherElement: Story = {
  name: "As another element",
  render: () => (
    <Box as="ul" gap="0.5x" padding={0} style={{ listStyle: "none", margin: 0 }}>
      <Box as="li"><Text>An unordered list built from Box</Text></Box>
      <Box as="li"><Text>Each item is a Box too</Text></Box>
    </Box>
  ),
};

export const OtherDisplayValues: Story = {
  name: "Other display values",
  render: () => (
    <Box gap="1x">
      <Text size="sm" color="neutral.muted">display=&quot;grid&quot; (the flex props no longer apply; use style for grid templates)</Text>
      <Box display="grid" gap="1x" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Cell>A</Cell><Cell>B</Cell><Cell>C</Cell>
      </Box>
    </Box>
  ),
};
