import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { BreadcrumbLink } from "./BreadcrumbLink";
import { Breadcrumbs } from "./Breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
  title: "Core/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            App navigation trail from{" "}
            <code>tokens/functional/components/breadcrumb/</code>.
            Use <code>Breadcrumbs</code> for the full trail;{" "}
            <code>BreadcrumbLink</code> for individual items or state previews.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Levels</h3>
            <div className="cube-docs-stack">
              <Breadcrumbs items={[{ label: "Level 1" }]} />
              <Breadcrumbs
                items={[
                  { label: "Level 1", href: "#level-1" },
                  { label: "Level 2" },
                ]}
              />
              <Breadcrumbs
                items={[
                  { label: "Level 1", href: "#level-1" },
                  { label: "Level 2", href: "#level-2" },
                  { label: "Level 3" },
                ]}
              />
            </div>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Link states</h3>
            <div className="cube-docs-row">
              <BreadcrumbLink href="#rest">Rest (link)</BreadcrumbLink>
              <BreadcrumbLink current>Active (current page)</BreadcrumbLink>
            </div>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
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
