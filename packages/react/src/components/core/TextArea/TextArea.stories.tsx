import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { TextArea } from "./TextArea";

const meta: Meta<typeof TextArea> = {
  title: "Core/TextArea",
  component: TextArea,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: { size: { control: "select", options: ["sm", "md", "lg"] }, rows: { control: "number" } },
  decorators: [(Story) => <div style={{ maxWidth: "20rem" }}>{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = { args: { label: "Notes", placeholder: "Write something" } };

export const WithDescription: Story = { args: { label: "Notes", description: "Visible to everyone on the team.", rows: 4 } };

export const Error: Story = { args: { label: "Notes", defaultValue: "value", error: "error message (description)" } };

export const ReadOnly: Story = { args: { label: "Notes", defaultValue: "Some read-only text\nover two lines", readOnly: true } };

export const Disabled: Story = { args: { label: "Notes", defaultValue: "value", disabled: true } };

export const Sizes: Story = {
  render: () => (
    <Box flexDirection="column" gap="md">
      <TextArea size="lg" label="lg" rows={2} />
      <TextArea size="md" label="md" rows={2} />
      <TextArea size="sm" label="sm" rows={2} />
    </Box>
  ),
};
