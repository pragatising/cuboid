import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Pets } from "@material-symbols-svg/react/rounded/pets";
import { RocketLaunch } from "@material-symbols-svg/react/rounded/rocket-launch";
import { ChevronRightIcon } from "../../../icons/material";
import { createMaterialIcon } from "../../../icons";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { Icon, type IconSize } from "./Icon";

const PetsIcon = createMaterialIcon(Pets);
const RocketLaunchIcon = createMaterialIcon(RocketLaunch);

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

export const AnyMaterialIcon: Story = {
  name: "Any Material Symbols icon (uncurated)",
  render: () => (
    <Stack gap="sm">
      <Text role="body" size="xs" color="muted">
        Only ~226 icons are pre-exported (`iconManifest`). For anything else, import the glyph
        directly from `@material-symbols-svg/react` (already a cuboid dependency) and wrap it
        with `createMaterialIcon` — same helper cuboid uses internally. Neither `pets` nor
        `rocket-launch` below is in cuboid&apos;s curated set.
      </Text>
      <Stack direction="horizontal" gap="sm" align="center">
        <Icon size="md">
          <PetsIcon />
        </Icon>
        <Icon size="md">
          <RocketLaunchIcon />
        </Icon>
      </Stack>
    </Stack>
  ),
};
