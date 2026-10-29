import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTokens } from "../../../mode";
import { colorGroups, resolveColorValue } from "../../../utils/colorPaths";
import { Box } from "../Box";
import { Text } from "../Text";
import { SwatchPicker } from "./SwatchPicker";
import type { SwatchGroup } from "./SwatchPicker";

const meta: Meta<typeof SwatchPicker> = {
  title: "Core/SwatchPicker",
  component: SwatchPicker,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: { onValueChange: { action: "value changed" }, allowCustom: { control: "boolean" }, clearable: { control: "boolean" } },
};
export default meta;
type Story = StoryObj<typeof SwatchPicker>;

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
    return <SwatchPicker {...args} aria-label="Text colour" groups={groups} />;
  },
};

/** With a long palette there is a search, and `allowCustom` lets the same field take any CSS colour: a swatch is a shortcut, not a fence. */
export const AnyColour: Story = {
  args: { allowCustom: true, clearable: true },
  render: (args) => {
    const groups = useGroups();
    const [value, setValue] = useState<string | undefined>("neutral.muted");
    return (
      <Box gap="2x" alignItems="flex-start">
        <SwatchPicker {...args} aria-label="Text colour" groups={groups} value={value} onValueChange={setValue} />
        <Text size="sm" color="neutral.muted">
          Chosen: {value ?? "nothing"}
        </Text>
      </Box>
    );
  },
};
