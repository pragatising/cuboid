import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { Icon } from "../Icon";
import { Text } from "../Text";
import { IconButton } from "./IconButton";

const star = <Icon name="star" />;

const meta: Meta<typeof IconButton> = {
  title: "Core/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "radio", options: ["sm", "md", "lg"] },
    variant: { control: "radio", options: ["outlined", "ghost"] },
    selected: { control: "boolean" },
    disabled: { control: "boolean" },
    description: { control: "text" },
    onClick: { action: "clicked" },
  },
};
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Playground: Story = {
  args: {
    size: "sm",
    variant: "outlined",
    selected: false,
    disabled: false,
    "aria-label": "Favorite",
    description: "Add to favorites",
    icon: star,
  },
};

export const Matrix: Story = {
  render: () => (
    <Box gap="1x">
      {(["outlined", "ghost"] as const).map((variant) => (
        <Box key={variant} flexDirection="row" alignItems="center" gap="1x">
          <Text size="sm" style={{ width: "5rem" }}>{variant}</Text>
          <IconButton aria-label="Favorite" description="Add to favorites" variant={variant} icon={star} />
          <IconButton aria-label="Favorite, selected" description="Remove from favorites" variant={variant} selected icon={star} />
          <IconButton aria-label="Favorite, unavailable" description="Unavailable" variant={variant} disabled icon={star} />
        </Box>
      ))}
    </Box>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Box flexDirection="row" alignItems="center" gap="1x">
      {(["sm", "md", "lg"] as const).map((size) => (
        <IconButton key={size} size={size} aria-label={`Favorite (${size})`} icon={star} />
      ))}
    </Box>
  ),
};

export const Loading: Story = {
  render: () => <IconButton aria-label="Saving" loading icon={star} />,
};
