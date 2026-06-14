import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { ArrowBackIcon, MenuIcon, SearchIcon } from "../../../icons/material";
import { Button } from "../Button";
import { Breadcrumbs } from "../Breadcrumb";
import { IconButton } from "../IconButton";
import { SiteHeader, SiteHeaderDivider } from "./SiteHeader";

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
                    <ArrowBackIcon />
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
