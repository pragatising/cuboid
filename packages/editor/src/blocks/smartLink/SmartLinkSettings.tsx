import { useEffect, useState } from "react";
import { Box, InputText, Popover, SegmentedControl, Select } from "@sragatiping/cuboid";
import type { SettingsProps } from "../../core";
import { SMART_LINK_APPEARANCES, SMART_LINK_HEIGHTS, type SmartLinkAttrs } from "./smartLink.read";
import { smartLinkUrl } from "./smartLinkUrl";

/**
 * The panel for a link's address, appearance and, for an embed, its height. It hangs from the block's gutter and edits the block in place.
 * The address is kept when it is committed (Enter, or leaving the field), not on each keystroke: each change would resolve a new link.
 */
export function SmartLinkSettings({ anchor, attrs, update, onClose }: SettingsProps<SmartLinkAttrs>) {
  const [draft, setDraft] = useState(attrs.url);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => setDraft(attrs.url), [attrs.url]);

  const commit = () => {
    if (draft === attrs.url) return;
    const url = smartLinkUrl(draft);
    if (url) update({ url });
    else setInvalid(true);
  };

  return (
    <Popover
      open
      anchorRef={anchor}
      trigger={<span aria-hidden style={{ position: "fixed", width: 0, height: 0 }} />}
      role="dialog"
      aria-label="Link settings"
      placement="bottom-start"
      autoFocus={false}
      returnFocusOnClose={false}
      onOpenChange={(open) => !open && onClose()}
    >
      <Box padding="1.5x" gap="1.5x" width="40x">
        <InputText
          label="Address"
          value={draft}
          error={invalid ? "Enter an address starting with http:// or https://" : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setInvalid(false);
          }}
          onBlur={commit}
          onKeyDown={(event) => event.key === "Enter" && commit()}
        />
        <SegmentedControl aria-label="Appearance" value={attrs.appearance} onValueChange={(value) => update({ appearance: value as SmartLinkAttrs["appearance"] })}>
          {SMART_LINK_APPEARANCES.map((appearance) => (
            <SegmentedControl.Item key={appearance.value} value={appearance.value}>
              {appearance.label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
        {attrs.appearance === "embed" ? (
          <Select label="Height" value={attrs.height} onValueChange={(value) => update({ height: value as SmartLinkAttrs["height"] })}>
            {SMART_LINK_HEIGHTS.map((height) => (
              <Select.Option key={height.value} value={height.value}>
                {height.label}
              </Select.Option>
            ))}
          </Select>
        ) : null}
      </Box>
    </Popover>
  );
}
