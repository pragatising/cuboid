import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { Stack } from "../Stack";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Core/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>Playground + visual variants reference</Subtitle>
          <Primary />
          <Controls />

          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 12px" }}>Variants</h3>
            <Stack gap={4}>
              {(["xs", "sm", "md", "lg"] as const).map((size) => (
                <Stack key={size} direction="horizontal" gap={3} align="center">
                  <div style={{ width: 28, fontSize: 12, opacity: 0.7 }}>{size.toUpperCase()}</div>
                  <Button size={size} variant="primary">Primary</Button>
                  <Button size={size} variant="secondary">Secondary</Button>
                  <Button size={size} variant="ghost">Ghost</Button>
                  <Button size={size} variant="danger">Danger</Button>
                  <Button size={size} variant="rounded">Rounded</Button>
                </Stack>
              ))}
            </Stack>
          </div>
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M4.427 9.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 9H4.604a.25.25 0 0 0-.177.427z" />
  </svg>
);

export const Playground: Story = {
  args: {
    size: "sm",
    variant: "primary",
    shape: "default",
    block: false,
    disabled: false,
    children: "Button",
    leadingIcon: undefined,
    trailingIcon: undefined,
  },
  argTypes: {
    size: { control: "radio", options: ["xs", "sm", "md", "lg"] },
    variant: { control: "radio", options: ["primary", "secondary", "ghost", "danger", "rounded"] },
    shape: { control: "radio", options: ["default", "rounded"] },
    block: { control: "boolean" },
    disabled: { control: "boolean" },
    leadingIcon: { control: "radio", options: [undefined, "plus"] },
    trailingIcon: { control: "radio", options: [undefined, "chevronDown"] },
    onClick: { action: "clicked" },
  },
  render: (args) => (
    <div style={{ maxWidth: 420, padding: 16, border: "1px dashed #ddd" }}>
      <Button
        {...args}
        leadingIcon={args.leadingIcon === "plus" ? <PlusIcon /> : undefined}
        trailingIcon={args.trailingIcon === "chevronDown" ? <ChevronDownIcon /> : undefined}
      />
    </div>
  ),
};
