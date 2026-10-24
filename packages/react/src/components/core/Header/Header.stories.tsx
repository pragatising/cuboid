import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../Button";
import { Breadcrumbs } from "../Breadcrumb";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { Header } from "./Header";

const meta: Meta<typeof Header> = {
  title: "Core/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof Header>;

export const Playground: Story = {
  render: (args) => (
    <Header {...args}>
      <Header.Leading>
        <IconButton aria-label="Open menu" variant="ghost" size="md" icon={<Icon name="menu" />} />
        <Breadcrumbs items={[{ label: "Section" }, { label: "Page" }]} />
      </Header.Leading>
      <Header.Trailing>
        <Button size="md" variant="secondary">Action</Button>
      </Header.Trailing>
    </Header>
  ),
};

export const WithBreadcrumbs: Story = {
  name: "With breadcrumbs",
  render: () => (
    <Header>
      <Header.Leading>
        <IconButton aria-label="Open menu" variant="ghost" size="md" icon={<Icon name="menu" />} />
        <Breadcrumbs items={[{ label: "Dashboard", href: "#dashboard" }, { label: "Customers", href: "#customers" }, { label: "Details" }]} />
      </Header.Leading>
      <Header.Trailing>
        <IconButton aria-label="Search" variant="ghost" size="md" icon={<Icon name="search" />} />
        <Button size="md" variant="secondary">New</Button>
      </Header.Trailing>
    </Header>
  ),
};

export const WithBackAndDivider: Story = {
  name: "With back + divider",
  render: () => (
    <Header>
      <Header.Leading>
        <IconButton aria-label="Go back" variant="ghost" size="md" icon={<Icon name="arrow_back" />} />
        <Header.Divider />
        <Breadcrumbs items={[{ label: "Record details" }]} />
      </Header.Leading>
      <Header.Trailing>
        <IconButton aria-label="More actions" variant="ghost" size="md" icon={<Icon name="menu" />} />
      </Header.Trailing>
    </Header>
  ),
};

export const Sticky: Story = {
  name: "Any CSS prop (sticky)",
  render: () => (
    <div style={{ height: 160, overflow: "auto" }}>
      <Header {...({ position: "sticky", top: 0, zIndex: 1 } as object)}>
        <Header.Leading>Sticks to the top while the page scrolls</Header.Leading>
      </Header>
      <div style={{ height: 600 }} />
    </div>
  ),
};
