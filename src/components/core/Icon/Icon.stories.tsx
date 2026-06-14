import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Stack } from "../Stack";
import { Icon, type IconSize } from "./Icon";

const ChevronRight = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
  </svg>
);

const meta: Meta<typeof Icon> = {
  title: "Core/Icon",
  component: Icon,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Sized SVG wrapper — pass icons with <code>currentColor</code>.
            Sizes map to <code>sizes.iconButton.*.icon</code>.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Sizes</h3>
            <Stack direction="horizontal" gap="sm" align="center">
              {(["xs", "sm", "md", "lg"] as IconSize[]).map((size) => (
                <Stack key={size} gap="xxs" align="center">
                  <Icon size={size}>
                    <ChevronRight />
                  </Icon>
                  <span className="cube-docs-caption">{size}</span>
                </Stack>
              ))}
            </Stack>
          </div>

          <Primary />
          <Controls />
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof Icon>;

export const Playground: Story = {
  args: { size: "sm" },
  argTypes: {
    size: { control: "radio", options: ["xs", "sm", "md", "lg"] },
  },
  render: (args) => (
    <Icon {...args}>
      <ChevronRight />
    </Icon>
  ),
};
