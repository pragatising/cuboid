import { useState } from "react";
import { Box, ColorPicker, Text } from "@sragatiping/cuboid";
import type { SwatchGroup } from "@sragatiping/cuboid";

const groups: SwatchGroup[] = [
  {
    label: "Neutral",
    swatches: [
      { value: "neutral.default", label: "Default", color: "#1f2328" },
      { value: "neutral.muted", label: "Muted", color: "#59636e" },
      { value: "neutral.subtle", label: "Subtle", color: "#8c959f" },
    ],
  },
  {
    label: "Status",
    swatches: [
      { value: "success.strong", label: "Success", color: "#1a7f37" },
      { value: "warning.strong", label: "Warning", color: "#9a6700" },
      { value: "danger.strong", label: "Danger", color: "#cf222e" },
      { value: "informational.strong", label: "Informational", color: "#0969da" },
    ],
  },
];

export function Default() {
  return <ColorPicker aria-label="Text colour" groups={groups} />;
}
Default.frame = { height: 360 };

export function Controlled() {
  const [value, setValue] = useState<string | undefined>("neutral.muted");
  return (
    <Box gap="2x" alignItems="flex-start">
      <ColorPicker aria-label="Text colour" groups={groups} value={value} onValueChange={setValue} clearable />
      <Text size="sm" color="neutral.muted">Chosen: {value ?? "nothing"}</Text>
    </Box>
  );
}
Controlled.frame = { height: 360 };

/** `custom` adds a side for any colour, which a tool that takes any colour turns on; a panel of design tokens leaves it off. */
export function AnyColour() {
  return <ColorPicker aria-label="Colour" groups={groups} custom clearable searchable showLabels />;
}
AnyColour.frame = { height: 460 };

export function Surface() {
  const [bordered, setBordered] = useState(false);
  return <ColorPicker aria-label="Surface colour" appearance="fill" groups={groups} bordered={bordered} onBorderedChange={setBordered} />;
}
Surface.frame = { height: 400 };
