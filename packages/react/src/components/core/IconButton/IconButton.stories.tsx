import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Stack } from "../Stack";
import { IconButton } from "./IconButton";

const StarIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
  </svg>
);

const meta: Meta<typeof IconButton> = {
  title: "Core/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            StyledIconButton (outlined / ghost). Pass <code>tooltip</code> for hover/focus hints;
            always set <code>aria-label</code> (or <code>aria-labelledby</code>) for the control name.
            With both <code>disabled</code> and <code>tooltip</code>, the control uses <code>aria-disabled</code> (not
            native <code>disabled</code>) so hover/focus still surface the tooltip.
          </Subtitle>
          <Primary />
          <Controls />

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Matrix</h3>
            <Stack gap="sm">
              <Stack direction="horizontal" gap="xs" align="center" wrap>
                <span className="cube-docs-matrix-label">outlined</span>
                <IconButton aria-label="Favorite" tooltip="Add to favorites" variant="outlined">
                  <StarIcon />
                </IconButton>
                <IconButton
                  aria-label="Favorite, selected"
                  tooltip="Remove from favorites"
                  variant="outlined"
                  selected
                >
                  <StarIcon />
                </IconButton>
                <IconButton aria-label="Favorite, unavailable" tooltip="Unavailable" variant="outlined" disabled>
                  <StarIcon />
                </IconButton>
              </Stack>
              <Stack direction="horizontal" gap="xs" align="center" wrap>
                <span className="cube-docs-matrix-label">ghost</span>
                <IconButton aria-label="Favorite" tooltip="Add to favorites" variant="ghost">
                  <StarIcon />
                </IconButton>
                <IconButton
                  aria-label="Favorite, selected"
                  tooltip="Remove from favorites"
                  variant="ghost"
                  selected
                >
                  <StarIcon />
                </IconButton>
                <IconButton aria-label="Favorite, unavailable" tooltip="Unavailable" variant="ghost" disabled>
                  <StarIcon />
                </IconButton>
              </Stack>
            </Stack>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Sizes</h3>
            <Stack direction="horizontal" gap="xs" align="center" wrap>
              {(["xs", "sm", "md", "lg"] as const).map((size) => (
                <IconButton key={size} size={size} aria-label={`Favorite (${size})`} variant="outlined">
                  <StarIcon />
                </IconButton>
              ))}
            </Stack>
          </div>
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Playground: Story = {
  args: {
    size: "xs",
    variant: "outlined",
    selected: false,
    disabled: false,
    "aria-label": "Favorite",
    tooltip: "Add to favorites",
    children: <StarIcon />,
  },
  argTypes: {
    size: { control: "radio", options: ["xs", "sm", "md", "lg"] },
    variant: { control: "radio", options: ["outlined", "ghost"] },
    selected: { control: "boolean" },
    disabled: { control: "boolean" },
    tooltip: { control: "text" },
    onClick: { action: "clicked" },
  },
  render: (args) => <IconButton {...args} />,
};
