import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Divider } from "./Divider";
import { Box } from "../Box";
import { Text } from "../Text";

const meta: Meta<typeof Divider> = {
  title: "Core/Divider",
  component: Divider,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Horizontal rule drawn from the <code>divider</code> component tokens. Use between list rows, sections, or
            stacked content — not for vertical header separators (see{" "}
            <code>Header.Divider</code>).
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Default</h3>
            <Box gap="sm">
              <Text>Section above</Text>
              <Divider />
              <Text>Section below</Text>
            </Box>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">List rows</h3>
            <Box as="ul">
              <Divider />
              {["First item", "Second item", "Third item"].map((label) => (
                <Box as="li" key={label}>
                  <Box paddingBlock="sm">
                    <Text>{label}</Text>
                  </Box>
                  <Divider />
                </Box>
              ))}
            </Box>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
  argTypes: {
    color: {
      control: "select",
      options: ["default", "muted"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  render: () => (
    <Box gap="sm">
      <Text>Content above the rule.</Text>
      <Divider />
      <Text>Content below the rule.</Text>
    </Box>
  ),
};

export const Muted: Story = {
  render: () => (
    <Box gap="sm">
      <Text color="neutral.muted">
        Softer separation with <code>color=&quot;muted&quot;</code>.
      </Text>
      <Divider color="muted" />
      <Text color="neutral.muted">
        Uses the translucent <code>divider.color.muted</code> token, so it adapts to the surface behind it.
      </Text>
    </Box>
  ),
};

export const ListRows: Story = {
  name: "List rows",
  render: () => (
    <Box as="ul" style={{ maxWidth: "24rem" }}>
      <Divider />
      {[
        { title: "Design systems at scale", summary: "Notes on tokens and composition." },
        { title: "Data pipelines", summary: "Billing and reporting workflows." },
        { title: "Building in the codebase", summary: "Designing with real data." },
      ].map((item) => (
        <Box as="li" key={item.title}>
          <Box paddingBlock="sm" gap="xxs">
            <Text>{item.title}</Text>
            <Text size="md" color="neutral.muted">
              {item.summary}
            </Text>
          </Box>
          <Divider />
        </Box>
      ))}
    </Box>
  ),
};

export const Playground: Story = {
  args: {
    color: "default",
  },
};
