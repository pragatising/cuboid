import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Icon } from "../Icon";
import { InputText } from "./InputText";

const meta: Meta<typeof InputText> = {
  title: "Core/InputText",
  component: InputText,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: { size: { control: "select", options: ["sm", "md", "lg"] } },
  decorators: [(Story) => <div style={{ maxWidth: "16rem" }}>{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof InputText>;

export const Default: Story = { args: { label: "Name", placeholder: "placeholder" } };

export const WithDescription: Story = { args: { label: "Name", description: "As it appears on your ID.", placeholder: "placeholder" } };

export const WithVisuals: Story = {
  args: {
    label: "Search",
    placeholder: "placeholder",
    leadingVisual: <Icon name="search" />,
    trailingVisual: <Icon name="keyboard_arrow_down" />,
  },
};

export const WithExtras: Story = {
  name: "Label help, count, help and error visuals",
  render: () => (
    <Box flexDirection="column" gap="md">
      <InputText label="Display name" labelHelp="Shown to everyone on your team." description="As it appears on your ID." descriptionVisual={<Icon name="info" />} showCount maxLength={30} defaultValue="Ada" />
      <InputText label="Email" error="Enter a valid address" errorVisual={<Icon name="error" />} defaultValue="ada@" />
    </Box>
  ),
};

export const Error: Story = { args: { label: "Name", defaultValue: "value", error: "error message (description)" } };

export const ReadOnly: Story = { args: { label: "Name", defaultValue: "value", readOnly: true } };

export const Disabled: Story = { args: { label: "Name", defaultValue: "value", disabled: true } };

export const Sizes: Story = {
  render: () => (
    <Box flexDirection="column" gap="md">
      <InputText size="lg" label="lg (32px)" defaultValue="value" leadingVisual={<Icon name="search" />} />
      <InputText size="md" label="md (28px)" defaultValue="value" leadingVisual={<Icon name="search" />} />
      <InputText size="sm" label="sm (24px)" defaultValue="value" leadingVisual={<Icon name="search" />} />
    </Box>
  ),
};
