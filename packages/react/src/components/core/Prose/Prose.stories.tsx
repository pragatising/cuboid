import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Prose } from "./Prose";

const meta: Meta<typeof Prose> = {
  title: "Core/Prose",
  component: Prose,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof Prose>;

export const Document: Story = {
  render: () => (
    <Prose>
      <h1>Heading one</h1>
      <p>A paragraph of body text, with a <a href="#">link</a> and some <code>inline code</code>.</p>
      <h2>Heading two</h2>
      <p>Rows are a gap apart; a heading adds its own space above, more for a higher level.</p>
      <ul>
        <li>First item</li>
        <li>Second item</li>
      </ul>
      <blockquote>A quotation.</blockquote>
      <h3>Heading three</h3>
      <p>Last paragraph.</p>
    </Prose>
  ),
};
