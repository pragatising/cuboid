import { Box, Link, SegmentedControl } from "@sragatiping/cuboid";
import { SMART_LINK_APPEARANCES, type SmartLinkAttrs } from "./smartLink.read";

/** What you can do to a link block from the block itself, while it is selected: change how it looks, and open it. The rest (address, height) is in its gutter settings. */
export function SmartLinkToolbar({ attrs, update }: { attrs: SmartLinkAttrs; update: (attrs: Partial<SmartLinkAttrs>) => void }) {
  return (
    <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap="2x" role="toolbar" aria-label="Link">
      <SegmentedControl aria-label="Appearance" value={attrs.appearance} onValueChange={(value) => update({ appearance: value as SmartLinkAttrs["appearance"] })}>
        {SMART_LINK_APPEARANCES.map((appearance) => (
          <SegmentedControl.Item key={appearance.value} value={appearance.value}>
            {appearance.label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
      <Link href={attrs.url} external size="sm">
        Open link
      </Link>
    </Box>
  );
}
