import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import type { StackGap, StackPadding } from "../../../theme/types";
import { Text } from "../Text";
import { Stack } from "./Stack";

const STACK_GAP_OPTIONS: StackGap[] = [
  "none",
  "xxs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "xxl",
];

const STACK_PADDING_OPTIONS: StackPadding[] = [
  "none",
  "xxs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "xxl",
];

const demoBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "2rem",
  minHeight: "2rem",
  padding: "0.25rem 0.5rem",
  background: "var(--cube-color-bg-gray-light-3, #f4f4f2)",
  border: "1px solid var(--cube-color-border-gray-2, #d8d7d4)",
  borderRadius: "0.375rem",
  fontSize: "0.875rem",
};

const paddedContainerStyle: React.CSSProperties = {
  background: "var(--cube-color-bg-gray-light-3, #f4f4f2)",
  borderRadius: "0.375rem",
};

function GapScaleRow({ gap }: { gap: StackGap }) {
  return (
    <Stack direction="horizontal" gap="sm" align="center">
      <Text role="body" size="xs" color="muted" style={{ minWidth: "7.5rem" }}>
        <code>gap=&quot;{gap}&quot;</code>
      </Text>
      <Stack direction="horizontal" gap={gap} align="center">
        {["A", "B", "C"].map((label) => (
          <div key={label} style={demoBoxStyle}>
            {label}
          </div>
        ))}
      </Stack>
    </Stack>
  );
}

function PaddingScaleRow({ padding }: { padding: StackPadding }) {
  return (
    <Stack direction="horizontal" gap="sm" align="stretch">
      <Text role="body" size="xs" color="muted" style={{ minWidth: "7.5rem", alignSelf: "center" }}>
        <code>padding=&quot;{padding}&quot;</code>
      </Text>
      <Stack padding={padding} style={paddedContainerStyle}>
        <div style={demoBoxStyle}>Content</div>
      </Stack>
    </Stack>
  );
}

const meta: Meta<typeof Stack> = {
  title: "Core/Stack",
  component: Stack,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Flex layout primitive — <code>gap</code>, <code>padding</code>,{" "}
            <code>paddingBlock</code>, <code>paddingInline</code>, <code>direction</code>,{" "}
            <code>align</code>, <code>justify</code>, and <code>wrap</code>.{" "}
            <code>gap</code> and <code>padding</code> each use{" "}
            <code>none</code>, <code>xxs</code> … <code>xxl</code>. Each prop accepts a scalar or{" "}
            <code>{`{ sm, md, lg }`}</code> for responsive layout (mobile-first).
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Gap scale</h3>
            <Stack gap="sm">
              {STACK_GAP_OPTIONS.map((gap) => (
                <GapScaleRow key={gap} gap={gap} />
              ))}
            </Stack>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Padding scale</h3>
            <Stack gap="sm">
              {STACK_PADDING_OPTIONS.map((padding) => (
                <PaddingScaleRow key={padding} padding={padding} />
              ))}
            </Stack>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Directional padding</h3>
            <Stack gap="sm">
              <Stack padding="md" style={paddedContainerStyle}>
                <Text role="body" size="sm">
                  <code>padding=&quot;md&quot;</code> (all sides)
                </Text>
              </Stack>
              <Stack padding="md" paddingInline="lg" style={paddedContainerStyle}>
                <Text role="body" size="sm">
                  <code>padding=&quot;md&quot;</code>{" "}
                  <code>paddingInline=&quot;lg&quot;</code>
                </Text>
              </Stack>
              <Stack
                paddingBlock="xs"
                paddingInline="lg"
                style={paddedContainerStyle}
              >
                <Text role="body" size="sm">
                  <code>paddingBlock=&quot;xs&quot;</code>{" "}
                  <code>paddingInline=&quot;lg&quot;</code>
                </Text>
              </Stack>
            </Stack>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Responsive direction</h3>
            <Text role="body" size="xs" color="muted">
              Vertical below md, horizontal at md+ — resize the preview frame to see it change.
            </Text>
            <Stack direction={{ sm: "vertical", md: "horizontal" }} gap="xs" align="center">
              <Text role="body" size="sm">Label</Text>
              <Text role="body" size="sm">Value</Text>
            </Stack>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
  argTypes: {
    as: { control: false },
    theme: { control: false },
    style: { control: false },
    className: { control: false },
    children: { control: false },
    direction: { control: "radio", options: ["vertical", "horizontal"] },
    gap: { control: "select", options: STACK_GAP_OPTIONS },
    padding: { control: "select", options: STACK_PADDING_OPTIONS },
    paddingBlock: { control: "select", options: STACK_PADDING_OPTIONS },
    paddingInline: { control: "select", options: STACK_PADDING_OPTIONS },
    align: {
      control: "select",
      options: ["", "flex-start", "center", "flex-end", "stretch", "baseline"],
    },
    justify: {
      control: "select",
      options: ["", "flex-start", "center", "flex-end", "space-between", "space-around"],
    },
    wrap: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof Stack>;

export const Playground: Story = {
  args: {
    direction: "vertical",
    gap: "xs",
    padding: "none",
    align: "",
    justify: "",
    wrap: false,
  },
  render: ({ align, justify, ...args }) => (
    <Stack {...args} align={align || undefined} justify={justify || undefined}>
      <Text role="body" size="sm">Item 1</Text>
      <Text role="body" size="sm">Item 2</Text>
      <Text role="body" size="sm">Item 3</Text>
    </Stack>
  ),
};

export const GapScale: Story = {
  name: "Features / Gap scale",
  render: () => (
    <Stack gap="sm">
      {STACK_GAP_OPTIONS.map((gap) => (
        <GapScaleRow key={gap} gap={gap} />
      ))}
    </Stack>
  ),
};

export const PaddingScale: Story = {
  name: "Features / Padding scale",
  render: () => (
    <Stack gap="sm">
      {STACK_PADDING_OPTIONS.map((padding) => (
        <PaddingScaleRow key={padding} padding={padding} />
      ))}
    </Stack>
  ),
};

export const DirectionalPadding: Story = {
  name: "Features / Directional padding",
  render: () => (
    <Stack gap="sm">
      <Stack padding="md" style={paddedContainerStyle}>
        <Text role="body" size="sm">
          <code>padding=&quot;md&quot;</code> (all sides)
        </Text>
      </Stack>
      <Stack padding="md" paddingInline="lg" style={paddedContainerStyle}>
        <Text role="body" size="sm">
          <code>padding=&quot;md&quot;</code>{" "}
          <code>paddingInline=&quot;lg&quot;</code>
        </Text>
      </Stack>
      <Stack paddingBlock="xs" paddingInline="lg" style={paddedContainerStyle}>
        <Text role="body" size="sm">
          <code>paddingBlock=&quot;xs&quot;</code>{" "}
          <code>paddingInline=&quot;lg&quot;</code>
        </Text>
      </Stack>
    </Stack>
  ),
};

export const Responsive: Story = {
  name: "Responsive (sm → md)",
  render: () => (
    <Stack
      direction={{ sm: "vertical", md: "horizontal" }}
      gap={{ sm: "xxs", md: "sm" }}
      align={{ sm: "flex-start", md: "center" }}
      justify={{ sm: "flex-start", md: "space-between" }}
    >
      <Text role="body" size="sm">Title</Text>
      <Text role="body" size="sm">Supporting text</Text>
    </Stack>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Stack gap="xs">
      <Text role="body" size="sm">Item 1</Text>
      <Text role="body" size="sm">Item 2</Text>
      <Text role="body" size="sm">Item 3</Text>
    </Stack>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Stack direction="horizontal" gap="xs" align="center">
      <Text role="body" size="sm">Left</Text>
      <Text role="body" size="sm">Center</Text>
      <Text role="body" size="sm">Right</Text>
    </Stack>
  ),
};

export const SpaceBetween: Story = {
  render: () => (
    <Stack direction="horizontal" justify="space-between" align="center">
      <Text role="body" size="sm">Leading</Text>
      <Text role="body" size="sm">Trailing</Text>
    </Stack>
  ),
};

export const WithPadding: Story = {
  render: () => (
    <Stack gap="sm" padding="md" style={paddedContainerStyle}>
      <Text role="body" size="sm">Item A</Text>
      <Text role="body" size="sm">Item B</Text>
    </Stack>
  ),
};

export const Wrap: Story = {
  render: () => (
    <Stack direction="horizontal" gap="xxs" wrap style={{ maxWidth: "18.75rem" }}>
      {["One", "Two", "Three", "Four", "Five", "Six"].map((l) => (
        <Text key={l} role="body" size="sm">
          {l}
        </Text>
      ))}
    </Stack>
  ),
};
