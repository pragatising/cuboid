import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Button } from "../Button";
import { Breadcrumbs } from "../Breadcrumb";
import { IconButton } from "../IconButton";
import { SiteHeader, SiteHeaderDivider } from "./SiteHeader";

const MenuIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable={false}>
    <path d="M2 4h12v1.5H2V4Zm0 3.25h12v1.5H2V7.25Zm0 3.25h12V12H2v-1.5Z" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable={false}>
    <path d="M7.78 3.22a.75.75 0 0 1 0 1.06L4.56 7.5H13a.75.75 0 0 1 0 1.5H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable={false}>
    <path d="M7 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM1 7a6 6 0 1 0 10.74 3.76l2.56 2.56a.75.75 0 1 0 1.06-1.06l-2.56-2.56A6 6 0 0 0 1 7Z" />
  </svg>
);

const meta: Meta<typeof SiteHeader> = {
  title: "Core/SiteHeader",
  component: SiteHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Shell only — pass app-specific content via <code>leading</code> and{" "}
            <code>trailing</code> slots. Tokens from{" "}
            <code>tokens/functional/components/site-header/</code>.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">With breadcrumbs</h3>
            <SiteHeader
              leading={
                <>
                  <IconButton aria-label="Open menu" variant="ghost" size="sm">
                    <MenuIcon />
                  </IconButton>
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
                  <IconButton aria-label="Search" variant="ghost" size="sm">
                    <SearchIcon />
                  </IconButton>
                  <Button size="sm" variant="secondary">
                    New
                  </Button>
                </>
              }
            />
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">With back + divider</h3>
            <SiteHeader
              leading={
                <>
                  <IconButton aria-label="Go back" variant="ghost" size="sm">
                    <BackIcon />
                  </IconButton>
                  <SiteHeaderDivider />
                  <Breadcrumbs items={[{ label: "Record details" }]} />
                </>
              }
              trailing={
                <IconButton aria-label="More actions" variant="ghost" size="sm">
                  <MenuIcon />
                </IconButton>
              }
            />
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof SiteHeader>;

export const Playground: Story = {
  render: (args) => (
    <SiteHeader
      {...args}
      leading={
        <>
          <IconButton aria-label="Open menu" variant="ghost" size="sm">
            <MenuIcon />
          </IconButton>
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
