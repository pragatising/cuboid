import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Box, InputText, Pill, Popover, SwatchGrid, Switch, useTokens } from "@sragatiping/cuboid";
import type { PillShade } from "@sragatiping/cuboid";
import { PILL_INTENSITIES, PILL_INTENSITY_LABELS, PILL_SHADES, isPillIntensity, isPillShade } from "../../utils/inline";
import { useAtomEditor } from "./useAtomEditor";

/** A pill: an inline atom whose label, colour family, emphasis and border are its attributes. It is Cuboid's `Pill`. */
export function PillView(props: NodeViewProps) {
  const { node } = props;
  const { open, field, select, update, dismiss } = useAtomEditor(props, (attrs) => String(attrs.label).trim() === "");
  const tokens = useTokens();
  const label = String(node.attrs.label);
  const shade = isPillShade(node.attrs.shade) ? node.attrs.shade : "gray";
  const intensity = isPillIntensity(node.attrs.intensity) ? node.attrs.intensity : "light";
  const bordered = Boolean(node.attrs.bordered);
  const family = (shade: PillShade) => (shade === "mag" ? "Magenta" : shade[0].toUpperCase() + shade.slice(1));
  // A row for each emphasis step, a column for each colour family: what the pill will look like is what each tile is.
  const rows = PILL_INTENSITIES.map((step) => ({
    label: PILL_INTENSITY_LABELS[step],
    swatches: PILL_SHADES.map((name) => ({
      value: `${name}.${step}`,
      label: `${family(name)} ${PILL_INTENSITY_LABELS[step].toLowerCase()}`,
      color: tokens.pill.color[name][step][bordered ? "bordered" : "filled"].bgColor,
    })),
  }));

  return (
    <NodeViewWrapper as="span" style={{ display: "inline-block" }}>
      <Popover
        open={open}
        // Leaving with no label removes the pill: an empty one is nothing to see and nothing to click.
        onOpenChange={(next) => (next ? select() : dismiss())}
        dismissible={false}
        autoFocus={false}
        role="dialog"
        aria-label="Pill"
        returnFocusOnClose={false}
        trigger={
          <Pill as="button" type="button" shade={shade} intensity={intensity} bordered={bordered}>
            {label || "Label"}
          </Pill>
        }
      >
        <Box padding="1.5x" gap="1.5x">
          <InputText ref={field} label="Label" placeholder="Tag" size="sm" value={label} onChange={(event) => update({ label: event.target.value })} />
          <SwatchGrid
            aria-label="Colour"
            groups={rows}
            value={`${shade}.${intensity}`}
            onValueChange={(value) => {
              const [nextShade, nextIntensity] = value.split(".");
              update({ shade: nextShade, intensity: nextIntensity });
            }}
          />
          <Switch label="Border" checked={bordered} onCheckedChange={(checked) => update({ bordered: checked })} />
        </Box>
      </Popover>
    </NodeViewWrapper>
  );
}
