import type { Meta, StoryObj } from "@storybook/react";
import tokens from "@sragatiping/cuboid-primitives";
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
    variant: { control: "select", options: Object.keys(tokens.light.callout).filter((key) => typeof (tokens.light.callout as Record<string, unknown>)[key] === "object") },
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

export const Variants: Story = {
  name: "Variants (one per callout colour token)",
  render: () => {
    const callout = tokens.light.callout as unknown as Record<string, unknown>;
    const variants = Object.keys(callout).filter((key) => typeof callout[key] === "object");
    return (
      <Box gap="2x" style={{ maxWidth: "36rem" }}>
        {variants.length === 0 ? <Text color="neutral.muted">No variant colours in the callout tokens yet.</Text> : null}
        {variants.map((variant) => (
          <Callout key={variant} variant={variant as never}>
            <Text color="neutral.contrast">{variant}</Text>
          </Callout>
        ))}
      </Box>
    );
  },
};

export const Playground: Story = {
  render: (args) => (
    <Callout {...args} style={{ maxWidth: "36rem" }}>
      <Text color="neutral.muted">Callout content goes here.</Text>
    </Callout>
  ),
};
