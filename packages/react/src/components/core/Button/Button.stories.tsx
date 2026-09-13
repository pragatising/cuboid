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
          <Subtitle>
            Token-driven variants (Figma DS—AI). All colors from{" "}
            <code>tokens/functional/components/button/</code>.
          </Subtitle>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Variants</h3>
            <Stack gap="sm">
              {(["xs", "sm", "md", "lg"] as const).map((size) => (
                <Stack key={size} direction="horizontal" gap="xs" align="center">
                  <span className="cube-docs-matrix-label cube-docs-matrix-label--narrow">{size.toUpperCase()}</span>
                  <Button size={size} variant="primary">Primary</Button>
                  <Button size={size} variant="secondary">Secondary</Button>
                  <Button size={size} variant="ghost">Ghost</Button>
                  <Button size={size} variant="danger">Danger</Button>
                  <Button size={size} variant="rounded">Rounded</Button>
                </Stack>
              ))}
            </Stack>
          </div>

          <div className="cube-docs-section">
            <h3 className="cube-docs-section__title">Pill shape</h3>
            <Stack direction="horizontal" gap="xs" align="center" wrap>
              <Button size="sm" variant="primary" shape="rounded">
                Primary pill
              </Button>
              <Button size="sm" variant="secondary" shape="rounded">
                Secondary pill
              </Button>
              <Button size="sm" variant="ghost" shape="rounded">
                Ghost pill
              </Button>
            </Stack>
          </div>

          <div className="cube-docs-section cube-docs-section--last">
            <h3 className="cube-docs-section__title">Block</h3>
            <div style={{ maxWidth: 280 }}>
              <Button block variant="primary">
                Full width
              </Button>
            </div>
          </div>

          <Primary />
          <Controls />
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
    <Button
      {...args}
      leadingIcon={args.leadingIcon === "plus" ? <PlusIcon /> : undefined}
      trailingIcon={args.trailingIcon === "chevronDown" ? <ChevronDownIcon /> : undefined}
    />
  ),
};
