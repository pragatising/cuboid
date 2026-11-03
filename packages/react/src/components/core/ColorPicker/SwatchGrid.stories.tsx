import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTokens } from "../../../mode";
import { Box } from "../Box";
import { Switch } from "../Switch";
import { Text } from "../Text";
import { SwatchGrid } from "./SwatchGrid";
import type { SwatchGroup } from "./SwatchGrid";

const meta: Meta<typeof SwatchGrid> = {
  title: "Core/SwatchGrid",
  component: SwatchGrid,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: { onValueChange: { action: "value changed" }, appearance: { control: "inline-radio", options: ["fill", "highlight", "text"] }, showLabels: { control: "boolean" } },
};
export default meta;
type Story = StoryObj<typeof SwatchGrid>;

/** Pill colours: a row for each emphasis step, a column for each colour family. */
function usePillRows(): SwatchGroup[] {
  const { pill } = useTokens();
  return useMemo(() => {
    const families = Object.keys(pill.color) as (keyof typeof pill.color)[];
    const steps = Object.keys(pill.color.gray) as (keyof typeof pill.color.gray)[];
    return steps.map((step) => ({ label: step, swatches: families.map((family) => ({ value: `${family}.${step}`, label: `${family} ${step}`, color: pill.color[family][step].filled.bgColor })) }));
  }, [pill]);
}

/** Rows of swatches in the page: no popover, no search, no headings. */
export const Default: Story = {
  render: (args) => {
    const rows = usePillRows();
    const [value, setValue] = useState<string | undefined>("blue.light");
    return <SwatchGrid {...args} aria-label="Pill colour" groups={rows} value={value} onValueChange={setValue} />;
  },
};

/** Beside other controls, as a panel that edits something in place: here a colour and a border. */
export const InAPanel: Story = {
  render: (args) => {
    const rows = usePillRows();
    const [value, setValue] = useState<string | undefined>("green.bold");
    const [border, setBorder] = useState(false);
    return (
      <Box gap="1.5x" alignItems="flex-start">
        <SwatchGrid {...args} aria-label="Pill colour" groups={rows} value={value} onValueChange={setValue} />
        <Switch label="Border" checked={border} onCheckedChange={setBorder} />
        <Text size="sm" color="neutral.muted">
          {value}, {border ? "bordered" : "no border"}
        </Text>
      </Box>
    );
  },
};

/** A highlight: the colour as a background, with an A on it. */
export const Highlight: Story = {
  args: { appearance: "highlight" },
  render: (args) => {
    const rows = usePillRows();
    return <SwatchGrid {...args} aria-label="Highlight" groups={rows.slice(0, 2)} />;
  },
};

/** A text colour: an A drawn in the colour. */
export const TextColour: Story = {
  args: { appearance: "text" },
  render: (args) => {
    const rows = usePillRows();
    return <SwatchGrid {...args} aria-label="Text colour" groups={rows.slice(2)} />;
  },
};

/** The row labels name the rows to assistive technology either way; this draws them. */
export const WithLabels: Story = {
  args: { showLabels: true },
  render: (args) => {
    const rows = usePillRows();
    return <SwatchGrid {...args} aria-label="Pill colour" groups={rows} />;
  },
};

/** A "no colour" tile, first in the grid, for a colour that can be taken off. */
export const WithNone: Story = {
  args: { appearance: "highlight" },
  render: (args) => {
    const rows = usePillRows();
    const [value, setValue] = useState<string | undefined>(undefined);
    return <SwatchGrid {...args} aria-label="Highlight" groups={rows.slice(0, 2)} value={value} onValueChange={setValue} none={{ selected: value === undefined, onSelect: () => setValue(undefined) }} />;
  },
};
