import { useState } from "react";
import { ColorPanel } from "@sragatiping/cuboid";
import type { SwatchGroup } from "@sragatiping/cuboid";

const groups: SwatchGroup[] = [
  {
    label: "Neutral",
    swatches: [
      { value: "neutral.default", label: "Default", color: "#1f2328" },
      { value: "neutral.muted", label: "Muted", color: "#59636e" },
    ],
  },
  {
    label: "Status",
    swatches: [
      { value: "success.strong", label: "Success", color: "#1a7f37" },
      { value: "danger.strong", label: "Danger", color: "#cf222e" },
      { value: "informational.strong", label: "Informational", color: "#0969da" },
    ],
  },
];

/** The picker's panel without the popover: for a place that is always open. */
export function Default() {
  const [value, setValue] = useState<string | undefined>("success.strong");
  return <ColorPanel aria-label="Colour" groups={groups} value={value} onValueChange={setValue} />;
}

export function AnyColour() {
  const [value, setValue] = useState<string | undefined>();
  return <ColorPanel aria-label="Colour" groups={groups} value={value} onValueChange={setValue} custom clearable />;
}
