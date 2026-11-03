import { Box, Popover, SwatchGrid, Switch } from "@sragatiping/cuboid";
import type { SettingsProps } from "../../core";
import type { CalloutAttrs } from "./callout.read";
import { HIGHLIGHT_LABELS, HIGHLIGHT_NAMES, highlightVars } from "../../utils/palette";

/** The colours a callout can be: Cuboid's highlights, in a grid of six to a row, as the portfolio lays them out. */
const COLUMNS = 6;
const SWATCHES = Array.from({ length: Math.ceil(HIGHLIGHT_NAMES.length / COLUMNS) }, (_, row) => ({
  label: `Row ${row + 1}`,
  swatches: HIGHLIGHT_NAMES.slice(row * COLUMNS, (row + 1) * COLUMNS).map((name) => ({ value: name, label: HIGHLIGHT_LABELS[name], color: highlightVars(name).background })),
}));

/**
 * The panel for a callout's colour and border: the swatches the pill's editor uses, and a switch for the border under them. It hangs from the
 * block's gutter and edits the callout in place.
 */
export function CalloutSettings({ anchor, attrs, update, onClose }: SettingsProps<CalloutAttrs>) {
  const { color, bordered } = attrs;
  return (
    <Popover
      open
      anchorRef={anchor}
      trigger={<span aria-hidden style={{ position: "fixed", width: 0, height: 0 }} />}
      role="dialog"
      aria-label="Callout color and border"
      placement="bottom-start"
      autoFocus={false}
      returnFocusOnClose={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <Box padding="1.5x" gap="1.5x">
        <SwatchGrid aria-label="Callout color" groups={SWATCHES} value={color} appearance="highlight" onValueChange={(value) => update({ color: value as CalloutAttrs["color"] })} />
        <Switch label="Border" checked={bordered} onCheckedChange={(checked) => update({ bordered: checked })} />
      </Box>
    </Popover>
  );
}
