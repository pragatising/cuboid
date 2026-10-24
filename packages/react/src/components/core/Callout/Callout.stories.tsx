import type { Meta, StoryObj } from "@storybook/react";
import { Callout } from "./Callout";
import { Box } from "../Box";
import { Text } from "../Text";

const meta: Meta<typeof Callout> = {
  title: "Core/Callout",
  component: Callout,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    backgroundColor: {
      control: "select",
      options: [undefined, "canvas.inset", "canvas.insetStrong", "neutral.light.2"],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Callout>;

export const Default: Story = {
  render: () => (
    <Callout style={{ maxWidth: "36rem" }}>
      <Text color="neutral.muted">A short note or pull quote set apart from the surrounding paragraph.</Text>
    </Callout>
  ),
};

export const InProse: Story = {
  name: "In prose",
  render: () => (
    <Box gap="2x" style={{ maxWidth: "36rem" }}>
      <Text>Body copy can introduce a quoted or emphasized passage.</Text>
      <Callout>
        <Text color="neutral.muted">Minimising back &amp; forth between stimulus, cognition and action.</Text>
      </Callout>
      <Text>Copy continues after the callout.</Text>
    </Box>
  ),
};

export const Multiline: Story = {
  render: () => (
    <Callout style={{ maxWidth: "36rem" }}>
      <Box gap="1x">
        <Text color="neutral.muted">System design spans data modeling and craft at the interface layer.</Text>
        <Text size="sm" color="neutral.muted">Zoomed out: architecture and services. Zoomed in: request, process, response.</Text>
      </Box>
    </Callout>
  ),
};

export const OtherSurface: Story = {
  name: "Other background",
  render: () => (
    <Callout backgroundColor="canvas.insetStrong" style={{ maxWidth: "36rem" }}>
      <Text>Uses <code>backgroundColor=&quot;canvas.insetStrong&quot;</code> instead of the default.</Text>
    </Callout>
  ),
};

export const Surfaces: Story = {
  name: "Surfaces: any bgColor token",
  render: () => (
    <Box gap="2x" style={{ maxWidth: "36rem" }}>
      {(["canvas.inset", "canvas.insetStrong", "informational.subtle", "success.subtle", "warning.subtle", "danger.subtle"] as const).map((surface) => (
        <Callout key={surface} backgroundColor={surface}>
          <Text color="neutral.contrast">backgroundColor=&quot;{surface}&quot;</Text>
        </Callout>
      ))}
    </Box>
  ),
};

export const PaletteSurfaces: Story = {
  name: "Surfaces: palette colours (indigo.0, green.1 …)",
  render: () => (
    <Box gap="2x" style={{ maxWidth: "36rem" }}>
      {(["indigo.0", "green.1", "orange.1", "purple.1", "highlight.yellow"] as const).map((surface) => (
        <Callout key={surface} backgroundColor={surface}>
          <Text color="neutral.contrast">backgroundColor=&quot;{surface}&quot;</Text>
        </Callout>
      ))}
    </Box>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Callout {...args} style={{ maxWidth: "36rem" }}>
      <Text color="neutral.muted">Callout content goes here.</Text>
    </Callout>
  ),
};
