import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Subtitle } from "@storybook/blocks";
import { Stack } from "../components/core/Stack";
import { Text } from "../components/core/Text";
import { Icon } from "../components/core/Icon";
import manifest from "./manifest.json";
import * as Icons from "./material";

type IconName = keyof typeof manifest;

const ICON_ENTRIES = Object.entries(manifest) as [IconName, (typeof manifest)[IconName]][];

const meta: Meta = {
  title: "Core/Icons",
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            Curated Material Symbols (<strong>Rounded</strong>, w400) via{" "}
            <code>@material-symbols-svg/react/rounded</code>. Size with <code>Icon</code>; add custom
            glyphs under <code>src/icons/custom/</code> and register in <code>manifest.json</code>.
          </Subtitle>
        </>
      ),
    },
  },
};

export default meta;

type Story = StoryObj;

export const Catalog: Story = {
  render: () => (
    <Stack gap="lg">
      {ICON_ENTRIES.map(([name, entry]) => {
        const IconComponent = Icons[entry.export as keyof typeof Icons];
        if (!IconComponent) return null;

        return (
          <Stack key={name} direction="horizontal" gap="md" align="center">
            <Icon size="md">
              <IconComponent />
            </Icon>
            <Stack gap="xxs">
              <Text variant="bodyMedium">{entry.export}</Text>
              <Text variant="caption" color="muted">
                {name} · {entry.category} · {entry.source}
              </Text>
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="horizontal" gap="md" align="center">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Stack key={size} gap="xxs" align="center">
          <Icon size={size}>
            <Icons.MenuIcon />
          </Icon>
          <Text variant="caption" color="muted">
            {size}
          </Text>
        </Stack>
      ))}
    </Stack>
  ),
};
