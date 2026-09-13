import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Button } from "../Button";
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
                Pass an optional <code>theme</code> prop to rebind{" "}
                <code>--cube-tooltip-*</code> CSS variables (same pattern as{" "}
                <code>Button</code>).
              </li>
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
        <IconButton aria-label="Settings" tooltip="Open settings" variant="ghost">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden focusable={false}>
            <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
            <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a1.873 1.873 0 0 1-1.255 1.275l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a1.873 1.873 0 0 1 1.275 1.255l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a1.873 1.873 0 0 1 1.255-1.275l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a1.873 1.873 0 0 1-1.275-1.255l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 1.255 1.275l.319.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.275 1.255l-.094.319c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-1.255-1.275l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094a1.873 1.873 0 0 0 1.275-1.255l.094-.319z" />
          </svg>
        </IconButton>
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
