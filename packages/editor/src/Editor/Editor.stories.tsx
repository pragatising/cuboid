import type { Meta, StoryObj } from "@storybook/react";
import { Editor } from "./Editor";
import { Editing as EditingExample, ViewOnly as ReadingExample } from "./Editor.examples";

const meta: Meta<typeof Editor> = {
  title: "Editor/Editor",
  component: Editor,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: { onChange: { action: "changed" }, readOnly: { control: "boolean" } },
};
export default meta;
type Story = StoryObj<typeof Editor>;

/** Editing: type, press `/` to add blocks, select text to format it, use the handle beside a block to move, change or remove it. */
export const Editing: Story = { render: () => <EditingExample /> };

/** View only: the same document, drawn as a reader gets it, with no editing engine. */
export const ViewOnly: Story = { render: () => <ReadingExample /> };
