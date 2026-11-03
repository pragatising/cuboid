import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTokens } from "../../../mode";
import { colorGroups, resolveColorValue } from "../../../utils/colorPaths";
import { Box } from "../Box";
import { Text } from "../Text";
import { ColorPicker } from "./ColorPicker";
import type { SwatchGroup } from "./ColorPicker";

const meta: Meta<typeof ColorPicker> = {
  title: "Core/ColorPicker",
  component: ColorPicker,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: { onValueChange: { action: "value changed" }, custom: { control: "boolean" }, clearable: { control: "boolean" } },
};
export default meta;
type Story = StoryObj<typeof ColorPicker>;

/** The token sets as swatches: each token path, drawn in the colour it resolves to in the active mode. */
function useGroups(): SwatchGroup[] {
  const tokens = useTokens();
  return useMemo(() => {
    const fg = colorGroups(tokens).fgColor as Record<string, Record<string, unknown>>;
    const groups = ["neutral", "danger", "success", "informational"].map((family) => ({
      label: family,
      swatches: Object.keys(fg[family] ?? {})
        .filter((key) => typeof fg[family][key] === "string")
        .map((key) => ({ value: `${family}.${key}`, color: resolveColorValue(colorGroups(tokens).fgColor, `${family}.${key}`) })),
    }));
    return groups.filter((group) => group.swatches.length > 0);
  }, [tokens]);
}

export const Default: Story = {
  render: (args) => {
    const groups = useGroups();
    return <ColorPicker {...args} aria-label="Text colour" groups={groups} />;
  },
};

/** A long palette can be searched (`searchable`) and named by group (`showLabels`). `custom` adds a Custom side, a gradient and a hue slider for any colour: a tool that takes any colour (a CSS inspector) turns it on; a panel of design tokens leaves it off. */
export const AnyColour: Story = {
  args: { custom: true, clearable: true, searchable: true, showLabels: true },
  render: (args) => {
    const groups = useGroups();
    const [value, setValue] = useState<string | undefined>("neutral.muted");
    return (
      <Box gap="2x" alignItems="flex-start">
        <ColorPicker {...args} aria-label="Text colour" groups={groups} value={value} onValueChange={setValue} />
        <Text size="sm" color="neutral.muted">
          Chosen: {value ?? "nothing"}
        </Text>
      </Box>
    );
  },
};

/** The same swatches as the portfolio's text-colour panel: an A drawn in each colour. */
export const TextColours: Story = {
  args: { appearance: "text", clearable: true },
  render: (args) => {
    const groups = useGroups();
    return <ColorPicker {...args} aria-label="Text colour" groups={groups} />;
  },
};

/** A surface: its colour and a border in the same hue are one choice, so the border is a switch under the colours, not a second colour. */
export const Surface: Story = {
  args: { appearance: "fill", clearable: true },
  render: (args) => {
    const groups = useGroups();
    const [bordered, setBordered] = useState(false);
    return <ColorPicker {...args} aria-label="Surface colour" groups={groups} bordered={bordered} onBorderedChange={setBordered} />;
  },
};
