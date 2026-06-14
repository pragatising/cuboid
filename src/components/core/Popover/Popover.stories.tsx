import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { Popover } from "./Popover";

const meta: Meta<typeof Popover> = {
  title: "Core/Popover",
  component: Popover,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Portaled, anchored floating panel — Figma <code>ActionMenu.Overlay</code>. Not the
            viewport scrim (<code>Overlay</code>) or passive label (<code>Tooltip</code>).
          </Subtitle>
          <Primary />
          <Controls />

          <div className="cube-docs-section cube-docs-section--wide">
            <h3 className="cube-docs-section__title">Notes</h3>
            <ul className="cube-docs-list">
              <li>
                <code>elevation=&quot;3x&quot;</code> (default) uses <code>shadows.popover</code>;{" "}
                <code>4x</code> uses <code>shadows.popoverElevated</code>.
              </li>
              <li>
                Dismisses on outside click and Escape when <code>dismissible</code> is true.
              </li>
              <li>
                Viewport flip / collision (e.g.{" "}
                <a href="https://floating-ui.com/" target="_blank" rel="noreferrer">
                  Floating UI
                </a>
                ) is future hardening — not in v1.
              </li>
            </ul>
          </div>
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover
      trigger={
        <Button variant="secondary" size="sm">
          Open popover
        </Button>
      }
      aria-label="Example popover"
    >
      <Stack gap="sm" padding="sm">
        <Text variant="bodySmall">Any interactive content can go here.</Text>
        <Button variant="primary" size="sm">
          Action
        </Button>
      </Stack>
    </Popover>
  ),
};

export const Controlled: Story = {
  render: function ControlledStory() {
    const [open, setOpen] = useState(false);
    return (
      <Stack gap="sm" direction="horizontal">
        <Popover
          open={open}
          onOpenChange={setOpen}
          trigger={
            <Button variant="secondary" size="sm">
              {open ? "Close" : "Open"} menu
            </Button>
          }
          aria-label="Controlled popover"
        >
          <Stack gap="xs" padding="sm">
            <Text variant="bodySmall">Controlled via open / onOpenChange.</Text>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Dismiss
            </Button>
          </Stack>
        </Popover>
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          Toggle externally
        </Button>
      </Stack>
    );
  },
};

export const Placements: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: 48,
        padding: 80,
        placeItems: "center",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      }}
    >
      {(
        [
          "top-start",
          "top",
          "top-end",
          "bottom-start",
          "bottom",
          "bottom-end",
          "left",
          "right",
        ] as const
      ).map((placement) => (
        <Popover
          key={placement}
          placement={placement}
          trigger={
            <Button variant="rounded" size="sm">
              {placement}
            </Button>
          }
          aria-label={`Placement ${placement}`}
        >
          <Stack padding="sm">
            <Text variant="caption">{placement}</Text>
          </Stack>
        </Popover>
      ))}
    </div>
  ),
};

export const Elevation: Story = {
  render: () => (
    <Stack direction="horizontal" gap="lg">
      {(["3x", "4x"] as const).map((elevation) => (
        <Popover
          key={elevation}
          elevation={elevation}
          trigger={
            <Button variant="secondary" size="sm">
              elevation {elevation}
            </Button>
          }
          aria-label={`Elevation ${elevation}`}
        >
          <Stack padding="sm">
            <Text variant="bodySmall">
              Shadow token: {elevation === "3x" ? "popover" : "popoverElevated"}
            </Text>
          </Stack>
        </Popover>
      ))}
    </Stack>
  ),
};

export const NotClippedByOverflow: Story = {
  name: "Portal (overflow: hidden)",
  render: () => (
    <div style={{ overflow: "hidden", height: 72, padding: 12 }}>
      <Popover
        trigger={
          <Button variant="secondary" size="sm">
            Open inside clipped box
          </Button>
        }
        aria-label="Overflow test"
      >
        <Stack padding="sm">
          <Text variant="caption">Still visible — portaled to document.body</Text>
        </Stack>
      </Popover>
    </div>
  ),
};
