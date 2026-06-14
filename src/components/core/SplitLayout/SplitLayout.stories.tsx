import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "../Sidebar";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { SplitLayout } from "./SplitLayout";

const meta: Meta<typeof SplitLayout> = {
  title: "Core/SplitLayout",
  component: SplitLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof SplitLayout>;

export const WithSidebar: Story = {
  render: () => (
    <SplitLayout>
      <Sidebar aria-label="Primary" width="sm">
        <Sidebar.Body>
          <Text variant="bodyMedium">Sidebar</Text>
        </Sidebar.Body>
      </Sidebar>
      <SplitLayout.Main>
        <Stack gap="md" padding="lg">
          <Text variant="titleMedium">Main</Text>
          <Text variant="bodyMedium" color="muted">
            Flex row shell — sidebar does not shrink; main grows and can scroll independently.
          </Text>
        </Stack>
      </SplitLayout.Main>
    </SplitLayout>
  ),
};
