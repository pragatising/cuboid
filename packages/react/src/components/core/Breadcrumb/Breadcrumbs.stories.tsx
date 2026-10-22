import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "../Box";
import { BreadcrumbLink } from "./BreadcrumbLink";
import { Breadcrumbs } from "./Breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
  title: "Core/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};
export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Playground: Story = {
  args: {
    items: [
      { label: "Dashboard", href: "#dashboard" },
      { label: "Customers", href: "#customers" },
      { label: "Details" },
    ],
  },
};

export const Levels: Story = {
  render: () => (
    <Box gap="2x">
      <Breadcrumbs items={[{ label: "Level 1" }]} />
      <Breadcrumbs items={[{ label: "Level 1", href: "#level-1" }, { label: "Level 2" }]} />
      <Breadcrumbs
        items={[
          { label: "Level 1", href: "#level-1" },
          { label: "Level 2", href: "#level-2" },
          { label: "Level 3" },
        ]}
      />
    </Box>
  ),
};

export const LinkStates: Story = {
  name: "Link states",
  render: () => (
    <Box flexDirection="row" gap="2x">
      <BreadcrumbLink href="#rest">Rest (link)</BreadcrumbLink>
      <BreadcrumbLink current>Active (current page)</BreadcrumbLink>
    </Box>
  ),
};
