import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Core/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: { layout: { control: "inline-radio", options: ["default", "compact"] } },
  decorators: [(Story) => <div style={{ maxWidth: "12rem" }}>{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = { args: { icon: "celebration", heading: "Heading", description: "Description" } };

export const Compact: Story = { args: { layout: "compact", icon: "celebration", description: "Description" } };

export const NoIcon: Story = { args: { heading: "No results", description: "Try a different search" } };

export const IconColours: Story = {
  args: { icon: "celebration", iconProps: { backgroundColor: "informational.subtle", color: "informational.strong" }, heading: "All done", description: "Nothing left to review" },
};
