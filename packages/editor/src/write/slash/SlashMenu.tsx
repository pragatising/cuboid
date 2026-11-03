import { useEffect, useRef } from "react";
import { ActionMenu, Popover } from "@sragatiping/cuboid";
import { BLOCK_TYPE_GROUP_LABELS } from "../blockTypes";
import type { BlockType, BlockTypeGroup } from "../blockTypes";

export const optionId = (index: number) => `cuboid-editor-slash-${index}`;

export type SlashMenuProps = {
  items: BlockType[];
  /** The option the arrow keys are on. */
  active: number;
  /** Where the caret is, in viewport coordinates. */
  anchor: DOMRect | null;
  onPick: (type: BlockType) => void;
};

/**
 * The list under the caret. It is a popover anchored to a zero-size mark at the caret and it never takes focus: the editor keeps it
 * and drives the list (see `slashRenderer`), pointing at the active option the way a combobox does.
 */
export function SlashMenu({ items, active, anchor, onPick }: SlashMenuProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: "nearest" });
  }, [active, items]);

  const groups = (Object.keys(BLOCK_TYPE_GROUP_LABELS) as BlockTypeGroup[])
    .map((group) => ({ group, entries: items.map((type, index) => ({ type, index })).filter((entry) => entry.type.group === group) }))
    .filter((g) => g.entries.length > 0);

  return (
    <Popover
      open
      anchorRef={anchorRef}
      trigger={<span ref={anchorRef} aria-hidden style={{ position: "fixed", left: anchor?.left ?? 0, top: anchor?.top ?? 0, width: 0, height: anchor?.height ?? 0 }} />}
      autoFocus={false}
      dismissible={false}
      returnFocusOnClose={false}
      maxHeight="320px"
      // Pressing an option must not move focus out of the editor, or the menu would close before the press lands.
      onMouseDown={(event) => event.preventDefault()}
    >
      {items.length === 0 ? (
        <ActionMenu.List role="listbox" aria-label="Insert a block">
          <ActionMenu.Item disabled>No results</ActionMenu.Item>
        </ActionMenu.List>
      ) : (
        <ActionMenu.List role="listbox" aria-label="Insert a block">
          {groups.map(({ group, entries }) => (
            <ActionMenu.Section key={group} label={BLOCK_TYPE_GROUP_LABELS[group]}>
              {entries.map(({ type, index }) => (
                <ActionMenu.Item key={type.value} id={optionId(index)} data-active={index === active ? "" : undefined} onClick={() => onPick(type)}>
                  {type.label}
                </ActionMenu.Item>
              ))}
            </ActionMenu.Section>
          ))}
        </ActionMenu.List>
      )}
    </Popover>
  );
}
