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
          </Subtitle>
          <Primary />
          <Controls />

          <div style={{ marginTop: 32, maxWidth: 640 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Planned improvements</h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, opacity: 0.85 }}>
              v1 keeps the implementation small. Track these as follow-ups for production
              hardening:
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.5 }}>
              <li>
                <strong>Portal</strong> — render the tooltip surface in a portal when ancestors
                use <code style={{ fontSize: 12 }}>overflow: hidden</code> so it is not clipped.
              </li>
              <li>
                <strong>Collision / flip</strong> — use viewport-aware positioning (e.g.{" "}
                <a
                  href="https://floating-ui.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Floating UI
                </a>
                ) so tooltips stay on-screen and flip edges when needed.
              </li>
              <li>
                <strong>Touch / long-press</strong> — hover-only tooltips are weak on touch; add a
                deliberate pattern (long-press, tap-to-toggle, or inline help) if mobile matters.
              </li>
              <li>
                <strong>Disabled triggers</strong> — native <code style={{ fontSize: 12 }}>disabled</code> on
                buttons blocks hover in many browsers. <code style={{ fontSize: 12 }}>IconButton</code> uses{" "}
                <code style={{ fontSize: 12 }}>aria-disabled</code> when <code style={{ fontSize: 12 }}>disabled</code>{" "}
                and <code style={{ fontSize: 12 }}>tooltip</code> are both set.
              </li>
              <li>
                <strong>Theme prop</strong> — optional <code style={{ fontSize: 12 }}>theme</code>{" "}
                override that rebinds <code style={{ fontSize: 12 }}>--cube-tooltip-*</code> CSS
                variables, matching <code style={{ fontSize: 12 }}>Button</code>.
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
    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, maxWidth: 480 }}>
      Prefer <code style={{ fontSize: 12 }}>IconButton</code>’s <code style={{ fontSize: 12 }}>tooltip</code> prop so
      the trigger stays associated with <code style={{ fontSize: 12 }}>role=&quot;tooltip&quot;</code> and{" "}
      <code style={{ fontSize: 12 }}>aria-describedby</code>. Example:
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
