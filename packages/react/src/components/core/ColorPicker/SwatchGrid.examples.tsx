import { useState } from "react";
import { SwatchGrid } from "@sragatiping/cuboid";
import type { SwatchGroup } from "@sragatiping/cuboid";

/** A row for each step, a column for each family. */
const rows: SwatchGroup[] = [
  {
    label: "Light",
    swatches: [
      { value: "blue.light", label: "Blue light", color: "#d6e6ff" },
      { value: "green.light", label: "Green light", color: "#d3f2dc" },
      { value: "red.light", label: "Red light", color: "#ffdcd7" },
      { value: "yellow.light", label: "Yellow light", color: "#fff1b8" },
    ],
  },
  {
    label: "Bold",
    swatches: [
      { value: "blue.bold", label: "Blue bold", color: "#1c60d4" },
      { value: "green.bold", label: "Green bold", color: "#1a7f37" },
      { value: "red.bold", label: "Red bold", color: "#cf222e" },
      { value: "yellow.bold", label: "Yellow bold", color: "#bf8700" },
    ],
  },
];

export function Default() {
  const [value, setValue] = useState<string | undefined>("blue.light");
  return <SwatchGrid aria-label="Colour" groups={rows} value={value} onValueChange={setValue} />;
}

export function WithLabels() {
  const [value, setValue] = useState<string | undefined>("green.bold");
  return <SwatchGrid aria-label="Colour" groups={rows} value={value} onValueChange={setValue} showLabels />;
}

export function Appearances() {
  const [value, setValue] = useState<string | undefined>("red.bold");
  return <SwatchGrid aria-label="Text colour" appearance="text" groups={rows} value={value} onValueChange={setValue} />;
}
