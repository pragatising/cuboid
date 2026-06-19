import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { ChevronRightIcon } from "../../../icons/material";
import { Stack } from "../Stack";
import { Icon, type IconSize } from "./Icon";

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
            Sized wrapper for SVG glyphs — import icons from <code>@yourscope/cube</code>{" "}
            (Material Symbols <strong>Rounded</strong>). Color inherits via{" "}
            <code>currentColor</code>. Sizes map to <code>sizes.icon.*</code> (
            <code>xs</code> 12px, <code>sm</code>/<code>md</code> 20px, <code>lg</code> 24px).
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Sizes</h3>
            <Stack direction="horizontal" gap="sm" align="center">
              {(["xs", "sm", "md", "lg"] as IconSize[]).map((size) => (
                <Stack key={size} gap="xxs" align="center">
                  <Icon size={size}>
                    <ChevronRightIcon />
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
      <ChevronRightIcon />
    </Icon>
  ),
};
