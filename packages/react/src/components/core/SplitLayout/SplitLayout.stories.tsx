import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "../Sidebar";
import { Box } from "../Box";
import { Heading } from "../Heading";
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
          <Sidebar.Section label="Section">
            <Sidebar.Item href="#one" current>One</Sidebar.Item>
            <Sidebar.Item href="#two">Two</Sidebar.Item>
          </Sidebar.Section>
        </Sidebar.Body>
      </Sidebar>
      <SplitLayout.Main>
        <Box gap="md" padding="lg">
          <Heading as="h1" size="md">Main</Heading>
          <Text size="md" color="neutral.muted">
            Flex row shell — sidebar does not shrink; main grows and can scroll independently.
          </Text>
        </Box>
      </SplitLayout.Main>
    </SplitLayout>
  ),
};
