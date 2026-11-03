import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ActionMenu, Box, Icon, IconButton } from "@sragatiping/cuboid";

/** As wide as the portfolio's menus (EDITOR_BLOCK_MENU_MIN_WIDTH), so a block type's name does not wrap. */
const MENU_MIN_WIDTH = "240px";

export type BlockTypeGroup = { label: string; options: { value: string; label: string }[] };

export type EditorBlockMenuProps = {
  /** The types the block can be turned into, in groups. */
  types: BlockTypeGroup[];
  /** The block's type now: its option is checked. */
  current: string;
  onTransform: (value: string) => void;
  /** Absent when the block is already first or last, so the item is disabled. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
  /** Called when the actions menu opens, so the block can be shown as selected while it is. */
  onSelectBlock: () => void;
  /** Called when either menu opens or closes, so the gutter can stay visible while one is open. */
  onMenuOpenChange?: (open: boolean) => void;
  /** Actions only this block has (`Callout color & border`), shown first in the actions menu. */
  actions?: ReactNode;
  /** Actions only this block has that come last (`Remove callout`), after Delete. */
  trailingActions?: ReactNode;
  /** What makes the grip a drag handle. The editor supplies it: only it knows what dragging a block means. */
  gripProps?: Pick<ComponentPropsWithoutRef<"button">, "draggable" | "onDragStart" | "onDragEnd">;
};

/**
 * The two buttons in a block's gutter: `+` turns the block into another type, the grip opens its actions (the grip is also the
 * drag handle, which the editor attaches). It knows nothing of the document: everything it does is a callback.
 */
export function EditorBlockMenu({ types, current, onTransform, onMoveUp, onMoveDown, onDelete, onSelectBlock, onMenuOpenChange, actions, trailingActions, gripProps }: EditorBlockMenuProps) {
  return (
    <Box flexDirection="row" alignItems="center" gap="0.5x" data-component="Editor.BlockMenu">
      <ActionMenu
        trigger={<IconButton aria-label="Turn into" variant="ghost" size="sm" icon={<Icon name="add" />} />}
        aria-label="Turn into"
        minWidth={MENU_MIN_WIDTH}
        onOpenChange={onMenuOpenChange}
      >
        {types.map((group) => (
          <ActionMenu.Section key={group.label} label={group.label}>
            {group.options.map((option) => (
              <ActionMenu.Item key={option.value} selected={option.value === current} onClick={() => onTransform(option.value)}>
                {option.label}
              </ActionMenu.Item>
            ))}
          </ActionMenu.Section>
        ))}
      </ActionMenu>

      <ActionMenu
        trigger={<IconButton aria-label="Actions" variant="ghost" size="sm" icon={<Icon name="drag_indicator" />} {...gripProps} />}
        aria-label="Actions"
        minWidth={MENU_MIN_WIDTH}
        placement="bottom-start"
        onOpenChange={(open) => {
          if (open) onSelectBlock();
          onMenuOpenChange?.(open);
        }}
      >
        {actions}
        <ActionMenu.Item leadingVisual={<Icon name="arrow_upward" />} onClick={onMoveUp} disabled={!onMoveUp}>
          Move up
        </ActionMenu.Item>
        <ActionMenu.Item leadingVisual={<Icon name="arrow_downward" />} onClick={onMoveDown} disabled={!onMoveDown}>
          Move down
        </ActionMenu.Item>
        <ActionMenu.Item leadingVisual={<Icon name="delete" />} onClick={onDelete}>
          Delete block
        </ActionMenu.Item>
        {trailingActions}
      </ActionMenu>
    </Box>
  );
}
