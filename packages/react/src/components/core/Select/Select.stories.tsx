import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Icon } from "../Icon";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Core/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: { size: { control: "select", options: ["sm", "md", "lg"] } },
  decorators: [(Story) => <div style={{ maxWidth: "16rem", minHeight: "14rem" }}>{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof Select>;

const FRUIT = ["Apple", "Banana", "Cherry", "Grape", "Lemon", "Mango"];

export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = useState("");
    return (
      <Select label="Fruit" placeholder="Choose one" value={value} onValueChange={setValue}>
        {FRUIT.map((name) => (
          <Select.Option key={name} value={name.toLowerCase()}>
            {name}
          </Select.Option>
        ))}
      </Select>
    );
  },
};

export const WithDescriptionAndError: Story = {
  render: () => (
    <Select label="Fruit" description="Pick the one you like most." error="Choose a fruit" placeholder="Choose one">
      <Select.Option value="apple">Apple</Select.Option>
      <Select.Option value="banana">Banana</Select.Option>
    </Select>
  ),
};

export const WithLabelHelp: Story = {
  render: () => (
    <Select label="Fruit" labelHelp="The one you would pick for a snack." description="You can change it later." descriptionVisual={<Icon name="info" />} placeholder="Choose one">
      <Select.Option value="apple">Apple</Select.Option>
      <Select.Option value="banana">Banana</Select.Option>
    </Select>
  ),
};

export const WithSectionsAndVisuals: Story = {
  render: () => (
    <Select label="Workspace" defaultValue="personal" leadingVisual={<Icon name="home" />} maxHeight="14rem">
      <Select.Section label="Yours">
        <Select.Option value="personal" description="Only you">
          Personal
        </Select.Option>
      </Select.Section>
      <Select.Section label="Shared">
        <Select.Option value="team">Team</Select.Option>
        <Select.Option value="archive" disabled>
          Archive
        </Select.Option>
      </Select.Section>
    </Select>
  ),
};

export const States: Story = {
  render: () => (
    <Box flexDirection="column" gap="md">
      <Select label="Read only" readOnly defaultValue="apple">
        <Select.Option value="apple">Apple</Select.Option>
      </Select>
      <Select label="Disabled" disabled defaultValue="apple">
        <Select.Option value="apple">Apple</Select.Option>
      </Select>
    </Box>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Box flexDirection="column" gap="md">
      {(["lg", "md", "sm"] as const).map((size) => (
        <Select key={size} size={size} label={`${size}`} defaultValue="apple">
          <Select.Option value="apple">Apple</Select.Option>
          <Select.Option value="banana">Banana</Select.Option>
        </Select>
      ))}
    </Box>
  ),
};

export const Loading: Story = {
  name: "Loading options",
  render: function LoadingStory() {
    const [loaded, setLoaded] = useState(false);
    return (
      <Select label="Region" placeholder="Open me" loading={!loaded} onOpenChange={(open) => open && !loaded && setTimeout(() => setLoaded(true), 1500)}>
        {loaded
          ? ["Europe", "Asia", "Africa"].map((name) => (
              <Select.Option key={name} value={name.toLowerCase()}>
                {name}
              </Select.Option>
            ))
          : null}
      </Select>
    );
  },
};
