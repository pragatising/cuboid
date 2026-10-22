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
  <Box backgroundColor="canvas.insetStrong" borderRadius="sm" paddingBlock="0.5x" paddingInline="1x">
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
      <Box paddingBlock="1x" paddingInline="3x" backgroundColor="canvas.inset" borderRadius="sm"><Text size="sm">block 1x, inline 3x</Text></Box>
      <Box paddingTop="0.5x" paddingLeft="3x" paddingBottom="2x" backgroundColor="canvas.inset" borderRadius="sm"><Text size="sm">top, left, bottom</Text></Box>
    </Box>
  ),
};

export const AxesAndSides: Story = {
  name: "Padding and margin: axes and sides (CSS names)",
  render: () => (
    <Box gap="2x" alignItems="flex-start">
      <Box flexDirection="row" gap="2x" alignItems="flex-start">
        <Box paddingInline="3x" paddingBlock="1x" backgroundColor="canvas.inset" borderRadius="sm"><Text size="sm">paddingInline 3x, paddingBlock 1x</Text></Box>
        <Box padding="2x" paddingTop={0} backgroundColor="canvas.inset" borderRadius="sm"><Text size="sm">padding 2x, paddingTop 0</Text></Box>
        <Box paddingBlockStart="3x" paddingInlineEnd="3x" backgroundColor="canvas.inset" borderRadius="sm"><Text size="sm">logical start / end</Text></Box>
      </Box>
      <Box width="24rem" backgroundColor="canvas.inset" borderRadius="sm" padding="1x">
        <Box marginInline="auto" paddingInline="2x" backgroundColor="canvas.insetStrong" borderRadius="sm"><Text size="sm">marginInline=&quot;auto&quot; centres a block</Text></Box>
      </Box>
    </Box>
  ),
};

export const Lengths: Story = {
  name: "Lengths: the Nx scale or any CSS length",
  render: () => (
    <Box gap="1x">
      {(["10x", "20x", "30x"] as const).map((width) => (
        <Box key={width} width={width} padding="1x" backgroundColor="canvas.insetStrong" borderRadius="sm"><Text size="sm">width=&quot;{width}&quot;</Text></Box>
      ))}
      <Box padding="10px" borderRadius="3px" backgroundColor="canvas.insetStrong" gap="0.25rem"><Text size="sm">padding=&quot;10px&quot; borderRadius=&quot;3px&quot; gap=&quot;0.25rem&quot;: raw px/rem work too</Text></Box>
      <Box width="50%" maxWidth="min(90vw, 40rem)" padding="1x" backgroundColor="canvas.insetStrong" borderRadius="sm"><Text size="sm">width=&quot;50%&quot; maxWidth=&quot;min(90vw, 40rem)&quot;: raw CSS passes through</Text></Box>
      <Box flexDirection="row" gap="1x">
        <Box flexBasis="20x" padding="1x" backgroundColor="canvas.insetStrong" borderRadius="sm"><Text size="sm">flexBasis 20x</Text></Box>
        <Box flexBasis="0" flexGrow={1} padding="1x" backgroundColor="canvas.insetStrong" borderRadius="sm"><Text size="sm">flexBasis 0, flexGrow 1</Text></Box>
      </Box>
    </Box>
  ),
};

export const AlignSelf: Story = {
  render: () => (
    <Box flexDirection="row" alignItems="flex-start" gap="1x" height="8rem" padding="1x" borderColor="subtle" borderRadius="sm">
      <Cell>alignItems: flex-start</Cell>
      <Box alignSelf="center"><Cell>alignSelf center</Cell></Box>
      <Box alignSelf="flex-end"><Cell>alignSelf flex-end</Cell></Box>
      <Box alignSelf="stretch" backgroundColor="canvas.insetStrong" borderRadius="sm" padding="1x"><Text size="sm">alignSelf stretch</Text></Box>
    </Box>
  ),
};

export const Borders: Story = {
  name: "Borders: whole, per axis, per side (tokens.border)",
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="2x">
      <Box padding="2x" border="default"><Text size="sm">border=&quot;default&quot;</Text></Box>
      <Box padding="2x" borderBottom="subtle"><Text size="sm">borderBottom=&quot;subtle&quot;</Text></Box>
      <Box padding="2x" borderBlock="default"><Text size="sm">borderBlock</Text></Box>
      <Box padding="2x" borderInlineStart="strong"><Text size="sm">borderInlineStart=&quot;strong&quot;</Text></Box>
      <Box padding="2x" border="translucent.2" borderTop="strong"><Text size="sm">border + borderTop override</Text></Box>
    </Box>
  ),
};

const STRIPES = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Cpath d='M0 16L16 0' stroke='%23236ae5' stroke-opacity='.35'/%3E%3C/svg%3E")`;

export const RawCssAndBackgrounds: Story = {
  name: "Raw CSS values and backgrounds",
  render: () => (
    <Box gap="2x">
      <Text size="sm" color="neutral.muted">Colours take a token or any CSS colour; backgrounds take CSS as written.</Text>
      <Box flexDirection="row" flexWrap="wrap" gap="1x">
        <Box padding="2x" backgroundColor="canvas.inset" color="neutral.contrast"><Text size="sm" color="currentColor">token + currentColor</Text></Box>
        <Box padding="2x" backgroundColor="#ffe100" color="#222"><Text size="sm" color="currentColor">#ffe100</Text></Box>
        <Box padding="2x" backgroundColor="rgb(35 106 229 / 15%)" color="rebeccapurple"><Text size="sm" color="currentColor">rgb() + a named colour</Text></Box>
        <Box padding="2x" backgroundColor="transparent" border="2px dashed #888"><Text size="sm">transparent + a raw border</Text></Box>
      </Box>
      <Box flexDirection="row" flexWrap="wrap" gap="1x">
        <Box width="20x" height="12x" borderRadius="8px" backgroundImage={STRIPES} backgroundColor="canvas.inset" alignItems="center" justifyContent="center">
          <Text size="sm">backgroundImage</Text>
        </Box>
        <Box width="20x" height="12x" borderRadius="0 0 8px 8px" backgroundImage="linear-gradient(135deg, #ff8635, #e01280)" padding="1x" alignItems="center" justifyContent="center">
          <Text size="sm" color="white">gradient, radius &quot;0 0 8px 8px&quot;</Text>
        </Box>
      </Box>
    </Box>
  ),
};

export const BorderParts: Story = {
  name: "Border as an object of parts",
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="2x">
      <Box padding="2x" border={{ color: "strong", width: "thick" }}><Text size="sm">{"{ color: strong, width: thick }"}</Text></Box>
      <Box padding="2x" border={{ side: ["top", "bottom"], color: "subtle", width: "thick" }}><Text size="sm">{"{ side: [top, bottom], … }"}</Text></Box>
      <Box padding="2x" border={{ side: "left", color: "#e01280", width: "0.5x" }}><Text size="sm">{"{ side: left, color: #e01280 }"}</Text></Box>
      <Box padding="2x" border={{ color: "#236ae5", style: "dashed", width: "2px" }}><Text size="sm">{"dashed, raw colour + width"}</Text></Box>
      <Box padding="2x" border={[{ side: "all", color: "subtle" }, { side: "top", color: "strong", width: "thicker" }]}><Text size="sm">list: all subtle, top thicker</Text></Box>
    </Box>
  ),
};

export const SizeParts: Story = {
  name: "Width and height as an object of parts",
  render: () => (
    <Box gap="1x">
      <Box width={{ size: "100%", min: "10x", max: "40x" }} padding="1x" backgroundColor="canvas.insetStrong" borderRadius="sm"><Text size="sm">width: size 100%, min 10x, max 40x (caps at 320px)</Text></Box>
      <Box width={{ size: "20x", max: "50%" }} padding="1x" backgroundColor="canvas.insetStrong" borderRadius="sm"><Text size="sm">width: size 20x, max 50%</Text></Box>
      <Box height={{ min: "8x" }} width="20x" padding="1x" backgroundColor="canvas.insetStrong" borderRadius="sm"><Text size="sm">height: min 8x</Text></Box>
    </Box>
  ),
};

export const AnyCssProperty: Story = {
  name: "Any CSS property is a prop",
  render: () => (
    <Box gap="1x">
      <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="1x" textAlign="center" fontSize="13px">
        <Cell>A</Cell><Cell>B</Cell><Cell>C</Cell>
      </Box>
      <Box padding="2x" backgroundColor="canvas.inset" borderRadius="md" aspectRatio="16 / 5" boxShadow="0 1px 4px #0002" alignItems="center" justifyContent="center" textTransform="uppercase" letterSpacing="0.08em">
        <Text size="sm">aspectRatio, boxShadow, textTransform, letterSpacing</Text>
      </Box>
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
      <Box padding="2x" backgroundColor="canvas.inset" borderColor="default" borderRadius="1.5x"><Text size="sm">1.5x (a scale step)</Text></Box>
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
      <Box position="absolute" insetInline="6x" top="3x"><Cell>inset inline 6x</Cell></Box>
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
