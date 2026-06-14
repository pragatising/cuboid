import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Divider } from "./Divider";
import { Stack } from "../Stack";
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
            Horizontal rule using functional border tokens. Use between list rows, sections, or
            stacked content — not for vertical header separators (see{" "}
            <code>SiteHeaderDivider</code>).
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Default</h3>
            <Stack gap="sm">
              <Text variant="bodyMedium">Section above</Text>
              <Divider />
              <Text variant="bodyMedium">Section below</Text>
            </Stack>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">List rows</h3>
            <Stack as="ul" gap="none">
              <Divider />
              {["First item", "Second item", "Third item"].map((label) => (
                <Stack as="li" key={label} gap="none">
                  <Stack paddingBlock="sm">
                    <Text variant="bodyMedium">{label}</Text>
                  </Stack>
                  <Divider />
                </Stack>
              ))}
            </Stack>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
  argTypes: {
    color: { control: "radio", options: ["default", "muted"] },
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  render: () => (
    <Stack gap="sm">
      <Text variant="bodyMedium">Content above the rule.</Text>
      <Divider />
      <Text variant="bodyMedium">Content below the rule.</Text>
    </Stack>
  ),
};

export const Muted: Story = {
  render: () => (
    <Stack gap="sm">
      <Text variant="bodyMedium" color="muted">
        Softer separation with <code>color=&quot;muted&quot;</code>.
      </Text>
      <Divider color="muted" />
      <Text variant="bodyMedium" color="muted">
        Uses <code>colors.functional.border.muted</code>.
      </Text>
    </Stack>
  ),
};

export const ListRows: Story = {
  name: "List rows",
  render: () => (
    <Stack as="ul" gap="none" style={{ maxWidth: "24rem" }}>
      <Divider />
      {[
        { title: "Design systems at scale", summary: "Notes on tokens and composition." },
        { title: "Portfolio intelligence", summary: "Credit and underwriting workflows." },
        { title: "Building in the codebase", summary: "Designing with real data." },
      ].map((item) => (
        <Stack as="li" key={item.title} gap="none">
          <Stack paddingBlock="sm" gap="xxs">
            <Text variant="bodyMedium">{item.title}</Text>
            <Text variant="caption" color="muted">
              {item.summary}
            </Text>
          </Stack>
          <Divider />
        </Stack>
      ))}
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    color: "default",
  },
};
