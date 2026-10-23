import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Container } from "./Container";
import { Box } from "../Box";
import { Heading } from "../Heading";
import { Text } from "../Text";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <Box backgroundColor="canvas.inset" style={{ outline: "1px dashed #e2e1dd", outlineOffset: "-1px" }}>
    {children}
  </Box>
);

const meta: Meta<typeof Container> = {
  title: "Core/Container",
  component: Container,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  argTypes: {
    width: { control: "radio", options: ["page", "content", "full"] },
    center: { control: "boolean" },
    paddingInline: { control: "select", options: [undefined, "xxs", "xs", "sm", "md", "lg", "xl", "xxl", false] },
    paddingBlock: { control: "select", options: [undefined, "xxs", "xs", "sm", "md", "lg", "xl", "xxl", false] },
    minHeight: { control: "radio", options: [undefined, "screen"] },
  },
};
export default meta;
type Story = StoryObj<typeof Container>;

export const PageWidth: Story = {
  name: "Page width",
  render: () => (
    <Shell>
      <Container width="page" paddingBlock="xl" gap="sm">
        <Heading as="h2" size="h2">Page shell</Heading>
        <Text color="neutral.muted">
          Max width from <code>container.maxWidth.page</code> (56rem). Centered with token padding.
        </Text>
      </Container>
    </Shell>
  ),
};

export const ContentWidth: Story = {
  name: "Content width",
  render: () => (
    <Shell>
      <Container width="page" paddingBlock="xl" gap="md">
        <Heading as="h2" size="h3">Inside page shell</Heading>
        <Container width="content" paddingInline={false} center={false} gap="sm">
          <Heading as="h3" size="h2">Article column</Heading>
          <Text color="neutral.muted">
            Max width from <code>container.maxWidth.content</code> (40rem).
          </Text>
        </Container>
      </Container>
    </Shell>
  ),
};

export const FullWidth: Story = {
  name: "Full width",
  render: () => (
    <Shell>
      <Container width="full" paddingBlock="lg">
        <Text><code>width=&quot;full&quot;</code>: no max-width cap.</Text>
      </Container>
    </Shell>
  ),
};

export const MinHeightScreen: Story = {
  name: "Min height screen",
  render: () => (
    <Shell>
      <Container width="page" minHeight="screen" paddingBlock="lg" gap="sm">
        <Heading as="h2" size="h3">Full viewport shell</Heading>
        <Text color="neutral.muted">
          <code>minHeight=&quot;screen&quot;</code> sets <code>min-height: 100svh</code>.
        </Text>
      </Container>
    </Shell>
  ),
};

export const Playground: Story = {
  args: { width: "page", center: true, paddingBlock: "lg", children: "Container content" },
  render: (args) => (
    <Shell>
      <Container {...args} />
    </Shell>
  ),
};
