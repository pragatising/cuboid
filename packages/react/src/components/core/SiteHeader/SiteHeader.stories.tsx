import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button";
import { Breadcrumbs } from "../Breadcrumb";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { SiteHeader, SiteHeaderDivider } from "./SiteHeader";

const meta: Meta<typeof SiteHeader> = {
  title: "Core/SiteHeader",
  component: SiteHeader,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof SiteHeader>;

export const Playground: Story = {
  render: (args) => (
    <SiteHeader
      {...args}
      leading={
        <>
          <IconButton aria-label="Open menu" variant="ghost" size="sm" icon={<Icon name="menu" />} />
          <Breadcrumbs items={[{ label: "Section" }, { label: "Page" }]} />
        </>
      }
      trailing={
        <Button size="sm" variant="secondary">
          Action
        </Button>
      }
    />
  ),
};

export const WithBreadcrumbs: Story = {
  name: "With breadcrumbs",
  render: () => (
    <SiteHeader
      leading={
        <>
          <IconButton aria-label="Open menu" variant="ghost" size="sm" icon={<Icon name="menu" />} />
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "#dashboard" },
              { label: "Customers", href: "#customers" },
              { label: "Details" },
            ]}
          />
        </>
      }
      trailing={
        <>
          <IconButton aria-label="Search" variant="ghost" size="sm" icon={<Icon name="search" />} />
          <Button size="sm" variant="secondary">New</Button>
        </>
      }
    />
  ),
};

export const WithBackAndDivider: Story = {
  name: "With back + divider",
  render: () => (
    <SiteHeader
      leading={
        <>
          <IconButton aria-label="Go back" variant="ghost" size="sm" icon={<Icon name="arrow_back" />} />
          <SiteHeaderDivider />
          <Breadcrumbs items={[{ label: "Record details" }]} />
        </>
      }
      trailing={<IconButton aria-label="More actions" variant="ghost" size="sm" icon={<Icon name="menu" />} />}
    />
  ),
};
