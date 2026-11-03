import { Button, Icon, IconButton, Tooltip } from "@sragatiping/cuboid";
import type { Frame } from "@sragatiping/bench/example";

export function Description() {
  return (
    <Tooltip text="Saves to the cloud" placement="bottom">
      <Button variant="secondary">Save</Button>
    </Tooltip>
  );
}
Description.frame = { height: 120 } satisfies Frame;

/** A label names a trigger that has no words of its own. */
export function Label() {
  return (
    <Tooltip type="label" text="Settings" placement="bottom">
      <IconButton aria-label="Settings" disableTooltip icon={<Icon name="settings" />} />
    </Tooltip>
  );
}
Label.frame = { height: 120 } satisfies Frame;

export function WithKeybindingHint() {
  return (
    <Tooltip text="Save" keybindingHint="Mod+S" placement="bottom">
      <Button variant="secondary">Save</Button>
    </Tooltip>
  );
}
WithKeybindingHint.frame = { height: 120 } satisfies Frame;
