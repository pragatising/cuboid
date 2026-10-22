import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { Tooltip } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Core/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Non-interactive floating label; styled with Cube tooltip tokens (Figma DS—AI).
            Renders in a portal so it is not clipped by <code>overflow: hidden</code> ancestors.
          </Subtitle>
          <Primary />
          <Controls />

          <div className="cube-docs-section cube-docs-section--wide">
            <h3 className="cube-docs-section__title">Notes</h3>
            <ul className="cube-docs-list">
              <li>
                Viewport collision / flip (e.g.{" "}
                <a href="https://floating-ui.com/" target="_blank" rel="noreferrer">
                  Floating UI
                </a>
                ) and touch-specific patterns are future hardening — not in v1.
              </li>
              <li>
                For icon-only controls, prefer <code>IconButton</code>&apos;s{" "}
                <code>tooltip</code> prop (handles{" "}
                <code>aria-disabled</code> when disabled + tooltip).
              </li>
            </ul>
          </div>
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: "Tooltip",
    placement: "bottom",
    compact: true,
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="secondary" size="sm">
        Hover or focus me
      </Button>
    </Tooltip>
  ),
};

export const LongText: Story = {
  args: {
    content:
      "Do not put essential information in a tooltip. Tooltips have low discoverability and have usability issues on devices without hover interactions.",
    placement: "bottom",
    compact: false,
  },
  render: (args) => (
    <div style={{ padding: 48 }}>
      <Tooltip {...args}>
        <Button variant="secondary" size="sm">
          Hover for guidance
        </Button>
      </Tooltip>
    </div>
  ),
};

export const WithIconButton: Story = {
  name: "With IconButton (built-in tooltip)",
  render: () => (
    <p className="cube-docs-note">
      Prefer <code>IconButton</code>’s <code>tooltip</code> prop so
      the trigger stays associated with <code>role=&quot;tooltip&quot;</code> and{" "}
      <code>aria-describedby</code>. Example:
      <span style={{ display: "inline-block", marginLeft: 8, verticalAlign: "middle" }}>
        <IconButton aria-label="Settings" tooltip="Open settings" variant="ghost" icon={<Icon name="settings" />} />
      </span>
    </p>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 48, padding: 64, placeItems: "center" }}>
      {(["top", "bottom", "left", "right"] as const).map((placement) => (
        <Tooltip key={placement} content={`${placement}`} placement={placement} compact>
          <Button variant="rounded" size="sm">
            {placement}
          </Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const NotClippedByOverflow: Story = {
  name: "Portal (overflow: hidden)",
  render: () => (
    <div style={{ overflow: "hidden", height: 72, padding: 12 }}>
      <Tooltip content="Still visible — portaled to document.body" compact>
        <Button variant="secondary" size="sm">
          Hover inside clipped box
        </Button>
      </Tooltip>
    </div>
  ),
};
