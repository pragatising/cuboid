import React, { useRef } from "react";
import { useHoverOpen, useTruncation } from "../../../../behaviors";
import { Popover } from "../../Popover";
import { Text } from "../../Text";

export type TableCellContentProps = {
  children?: React.ReactNode;
  /** The whole text, shown when the content is cut off. Defaults to the content when that is a string. */
  fullText?: string;
  /** Whether to watch for the content being cut off. */
  reveal: boolean;
};

/**
 * A cell's content in its own box. Where the stylesheet cuts the content off, and only then, the box becomes a tab stop that opens a popover
 * with the whole text, below the cell and as wide as it: after the pointer rests on it, or when it is clicked or focused. The box itself always
 * stays, so the measuring never loses its element.
 */
export function TableCellContent({ children, fullText, reveal }: TableCellContentProps) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const text = fullText ?? (typeof children === "string" ? children : undefined);
  const truncated = useTruncation({ ref: boxRef, enabled: reveal && text !== undefined, content: children });
  const { open, onOpenChange, triggerProps } = useHoverOpen({ enabled: truncated });

  return (
    <span ref={boxRef} data-component="Table.Cell.Content" data-truncated={truncated ? "" : undefined}>
      {truncated && text !== undefined ? (
        <Popover
          open={open}
          onOpenChange={onOpenChange}
          anchorRef={boxRef}
          matchAnchorWidth
          placement="bottom-start"
          autoFocus={false}
          returnFocusOnClose={false}
          trigger={
            <span tabIndex={0} data-component="Table.Cell.Reveal" aria-expanded={open} {...triggerProps}>
              {children}
            </span>
          }
        >
          <Popover.Body>
            <Text size="md" color="neutral.muted">
              {text}
            </Text>
          </Popover.Body>
        </Popover>
      ) : (
        children
      )}
    </span>
  );
}
