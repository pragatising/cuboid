import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Text } from "../Text";
import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
  title: "Core/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    label: { control: "text" },
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    onCheckedChange: { action: "checked changed" },
  },
};
export default meta;
type Story = StoryObj<typeof Switch>;

export const Playground: Story = {
  args: { label: "Switch Label", defaultChecked: false },
};

export const OffAndOn: Story = {
  render: () => (
    <Box gap="3x" alignItems="flex-start">
      <Switch label="Off" />
      <Switch label="On" defaultChecked />
    </Box>
  ),
};

export const States: Story = {
  render: () => (
    <Box gap="3x" alignItems="flex-start">
      <Switch label="Off, disabled" disabled />
      <Switch label="On, disabled" disabled defaultChecked />
      <Switch label="On, read-only" readOnly defaultChecked />
    </Box>
  ),
};

export const WithoutLabel: Story = {
  render: () => <Switch aria-label="Dark mode" />,
};

export const Controlled: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <Box gap="2x" alignItems="flex-start">
        <Switch label="Notifications" checked={on} onCheckedChange={setOn} />
        <Text size="sm" color="neutral.muted">
          {on ? "On" : "Off"}
        </Text>
      </Box>
    );
  },
};

export const InAForm: Story = {
  render: () => (
    <form onSubmit={(event) => event.preventDefault()}>
      <Switch label="Send me updates" name="updates" value="yes" />
    </form>
  ),
};
