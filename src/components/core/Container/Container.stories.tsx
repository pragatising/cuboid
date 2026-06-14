import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Container } from "./Container";
import { Stack } from "../Stack";
import { Text } from "../Text";

const shellStyle: React.CSSProperties = {
  background: "var(--cube-colors-functional-background-muted, #f9f9f8)",
  outline: "1px dashed var(--cube-colors-functional-border-default, #e2e1dd)",
  outlineOffset: "-1px",
};

const meta: Meta<typeof Container> = {
  title: "Core/Container",
  component: Container,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Page shell — max-width, horizontal padding, and optional vertical fill. Tokens from{" "}
            <code>tokens/functional/size/layout.json</code> (<code>pageMaxWidth</code>,{" "}
            <code>contentMaxWidth</code>, <code>pagePaddingInline</code>).
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Page width (default)</h3>
            <div style={shellStyle}>
              <Container width="page">
                <Stack paddingBlock="lg" gap="sm">
                  <Text variant="titleSmall">Portfolio shell</Text>
                  <Text variant="bodyMedium" color="muted">
                    Use <code>width=&quot;page&quot;</code> for the site wrapper.
                  </Text>
                </Stack>
              </Container>
            </div>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Content width</h3>
            <div style={shellStyle}>
              <Container width="page">
                <Stack paddingBlock="lg">
                  <Container width="content" paddingInline={false} center={false}>
                    <Text variant="bodyMedium">
                      Narrow reading column via <code>width=&quot;content&quot;</code>.
                    </Text>
                  </Container>
                </Stack>
              </Container>
            </div>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
  argTypes: {
    width: { control: "radio", options: ["page", "content", "full"] },
    center: { control: "boolean" },
    paddingInline: {
      control: "select",
      options: ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", false],
    },
    minHeight: { control: "radio", options: [undefined, "screen"] },
  },
};

export default meta;
type Story = StoryObj<typeof Container>;

export const PageWidth: Story = {
  name: "Page width",
  render: () => (
    <div style={shellStyle}>
      <Container width="page">
        <Stack paddingBlock="xl" gap="sm">
          <Text variant="titleMedium">Page shell</Text>
          <Text variant="bodyMedium" color="muted">
            Max width from <code>layout.pageMaxWidth</code> (56rem). Centered with token padding.
          </Text>
        </Stack>
      </Container>
    </div>
  ),
};

export const ContentWidth: Story = {
  name: "Content width",
  render: () => (
    <div style={shellStyle}>
      <Container width="page">
        <Stack paddingBlock="xl" gap="md">
          <Text variant="titleSmall">Inside page shell</Text>
          <Container width="content" paddingInline={false} center={false}>
            <Stack gap="sm">
              <Text variant="titleMedium">Article column</Text>
              <Text variant="bodyMedium" color="muted">
                Max width from <code>layout.contentMaxWidth</code> (40rem).
              </Text>
            </Stack>
          </Container>
        </Stack>
      </Container>
    </div>
  ),
};

export const FullWidth: Story = {
  name: "Full width",
  render: () => (
    <div style={shellStyle}>
      <Container width="full">
        <Stack paddingBlock="lg">
          <Text variant="bodyMedium">
            <code>width=&quot;full&quot;</code> — no max-width cap.
          </Text>
        </Stack>
      </Container>
    </div>
  ),
};

export const MinHeightScreen: Story = {
  name: "Min height screen",
  render: () => (
    <div style={shellStyle}>
      <Container width="page" minHeight="screen">
        <Stack paddingBlock="lg" gap="sm">
          <Text variant="titleSmall">Full viewport shell</Text>
          <Text variant="bodyMedium" color="muted">
            <code>minHeight=&quot;screen&quot;</code> sets <code>min-height: 100svh</code>.
          </Text>
        </Stack>
      </Container>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    width: "page",
    center: true,
    children: "Container content",
  },
  render: (args) => (
    <div style={shellStyle}>
      <Container {...args}>
        <Stack paddingBlock="lg">
          <Text variant="bodyMedium">{args.children}</Text>
        </Stack>
      </Container>
    </div>
  ),
};
