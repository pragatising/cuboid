import { useEffect, useRef } from "react";
import type { Ref } from "react";
import { Box, useTokens } from "@sragatiping/cuboid";

export type EditorTitleProps = {
  value: string;
  onChange?: (title: string) => void;
  /** Read as a heading, with nothing to type in; and nothing at all while there is no title. */
  readOnly?: boolean;
  /** Enter and ArrowDown leave the title for the page's first block. */
  onExit?: () => void;
  placeholder?: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * The page's name: one line you type in, set as a heading (it is not a block of the document, so it is not one of its headings) with "Untitled" while
 * it is empty. Read, it is the page's `h1`. Enter and ArrowDown go to the first block; pasted text goes in as plain text.
 */
export function EditorTitle({ value, onChange, readOnly = false, onExit, placeholder = "Untitled", ref }: EditorTitleProps) {
  const { heading, prose } = useTokens();
  const own = useRef<HTMLDivElement | null>(null);

  // The text is the field's own while it is typed in; it is set from `value` only when `value` is not what is there.
  useEffect(() => {
    if (own.current && own.current.textContent !== value) own.current.textContent = value;
  }, [value]);

  const look = { font: heading.size.h1, lineHeight: prose.sizes.headingLineHeight, color: "neutral.contrast" as const, margin: 0 as const, padding: "0.5x" as const };
  if (readOnly) return value ? <Box as="h1" {...look} data-component="Editor.Title">{value}</Box> : null;

  return (
    <Box position="relative" data-component="Editor.Title">
      {value ? null : (
        <Box position="absolute" top={0} left={0} pointerEvents="none" {...look} color="neutral.disabled" aria-hidden="true">
          {placeholder}
        </Box>
      )}
      <Box
        {...look}
        ref={(node: HTMLDivElement | null) => {
          own.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
        }}
        role="textbox"
        aria-label="Title"
        contentEditable
        suppressContentEditableWarning
        outline="none"
        onInput={(event: React.FormEvent<HTMLDivElement>) => onChange?.(event.currentTarget.textContent ?? "")}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key === "Enter" || event.key === "ArrowDown") {
            event.preventDefault();
            onExit?.();
          }
        }}
        onPaste={(event: React.ClipboardEvent) => {
          event.preventDefault();
          document.execCommand("insertText", false, event.clipboardData.getData("text/plain").replace(/\s+/g, " "));
        }}
      />
    </Box>
  );
}
