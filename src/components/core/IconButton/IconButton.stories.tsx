import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { IconButton } from "./IconButton";

// Sample SVG icons — in a real project these would come from an icon library
const CopyIcon = ({ size }: { size?: number }) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 16 16" fill="currentColor">
    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
  </svg>
);

const TrashIcon = ({ size }: { size?: number }) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 16 16" fill="currentColor">
    <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.559l.66 6.6a.25.25 0 0 0 .249.228h5.19a.25.25 0 0 0 .249-.228l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.591l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
  </svg>
);

const meta: Meta<typeof IconButton> = {
  title: "Core/IconButton",
  component: IconButton,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Sizes: Story = {
  render: () => (
    <Stack gap={5}>
      <Text variant="titleSmall">Sizes</Text>
      <Stack direction="horizontal" gap={4} align="center">
        <Stack gap={2} align="center">
          <IconButton size="sm" aria-label="Copy (sm)" icon={<CopyIcon size={16} />} />
          <Text variant="caption" color="muted">sm 24px</Text>
        </Stack>
        <Stack gap={2} align="center">
          <IconButton size="md" aria-label="Copy (md)" icon={<CopyIcon size={20} />} />
          <Text variant="caption" color="muted">md 32px</Text>
        </Stack>
      </Stack>
    </Stack>
  ),
};

export const Variants: Story = {
  render: () => (
    <Stack gap={5}>
      <Text variant="titleSmall">Variants (md size)</Text>
      <Stack direction="horizontal" gap={3} align="center">
        <IconButton variant="default" aria-label="Copy" icon={<CopyIcon size={20} />} />
        <IconButton variant="ghost" aria-label="Copy ghost" icon={<CopyIcon size={20} />} />
        <IconButton variant="danger" aria-label="Delete" icon={<TrashIcon size={20} />} />
      </Stack>
    </Stack>
  ),
};

export const DisabledState: Story = {
  render: () => (
    <Stack direction="horizontal" gap={3} align="center">
      <IconButton disabled aria-label="Copy (disabled)" icon={<CopyIcon size={20} />} />
      <IconButton disabled variant="ghost" aria-label="Copy ghost (disabled)" icon={<CopyIcon size={20} />} />
    </Stack>
  ),
};
