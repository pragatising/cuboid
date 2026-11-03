import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { Box, Button, Icon, IconButton, InputText, Popover, ColorPicker } from "@sragatiping/cuboid";
import type { IconProps } from "@sragatiping/cuboid";
import { HIGHLIGHT_GROUPS, TEXT_COLOR_GROUPS } from "../../../utils/palette";
import type { PaletteGroup } from "../../../utils/palette";
import { safeHref } from "../../../utils/link";
import { useSelectionToolbar } from "./useSelectionToolbar";

/** The portfolio lays its colours out as a grid of six to a row, with no headings: the palette's own groups are for the code, not the person. */
const COLUMNS = 6;
const gridOf = (groups: PaletteGroup[]) => {
  const all = groups.flatMap((g) => g.colors);
  return Array.from({ length: Math.ceil(all.length / COLUMNS) }, (_, row) => ({
    label: `Row ${row + 1}`,
    swatches: all.slice(row * COLUMNS, (row + 1) * COLUMNS).map((c) => ({ value: c.value, color: c.color, label: c.label })),
  }));
};
const TEXT_GRID = gridOf(TEXT_COLOR_GROUPS);
const HIGHLIGHT_GRID = gridOf(HIGHLIGHT_GROUPS);
/** The colour the text already has: choosing it takes the colour off, as the portfolio's first tile does. */
const DEFAULT_TEXT_COLOR = "neutral.contrast";

type Format = { mark: string; label: string; icon: IconProps["name"] };
const FORMATS: Format[] = [
  { mark: "bold", label: "Bold", icon: "format_bold" },
  { mark: "italic", label: "Italic", icon: "format_italic" },
  { mark: "underline", label: "Underline", icon: "format_underlined" },
  { mark: "code", label: "Code", icon: "code" },
];

/**
 * The link button and the small form it opens: the text that is shown, and where it goes. An address that is not safe to link to is refused
 * with a message, not silently dropped. Changing the text replaces the selected text with the new text, linked.
 */
function LinkButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string>();
  const active = editor.isActive("link");
  const addressField = useRef<HTMLInputElement>(null);
  const { selection, doc } = editor.state;
  // The text can only be edited when the selection is within one block: across blocks, replacing it would join them.
  const editableText = selection.$from.sameParent(selection.$to);
  const selected = () => doc.textBetween(selection.from, selection.to, " ");

  // The text is already known (it is what is selected), so the address is what is typed first. The popover would focus the first field.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => addressField.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const apply = () => {
    const href = safeHref(address);
    if (!href) return setError("Enter a web address, an email or a phone link");
    const label = text.trim();
    if (editableText && label && label !== selected()) {
      editor
        .chain()
        .focus()
        .command(({ tr, state }) => {
          tr.replaceWith(state.selection.from, state.selection.to, state.schema.text(label, [state.schema.marks.link.create({ href })]));
          return true;
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setOpen(false);
  };
  const remove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setText(selected());
          setAddress(String(editor.getAttributes("link").href ?? ""));
          setError(undefined);
        }
      }}
      role="dialog"
      aria-label="Link"
      placement="bottom-start"
      autoFocus={false}
      trigger={<IconButton aria-label="Link" variant="ghost" size="sm" selected={active} icon={<Icon name="link" />} />}
    >
      <Box padding="1.5x" gap="1x" style={{ minWidth: 280 }}>
        {editableText ? <InputText label="Text" placeholder="Text to show" size="sm" value={text} onChange={(event) => setText(event.target.value)} /> : null}
        <InputText
          label="Link"
          placeholder="Paste or type an address"
          size="sm"
          ref={addressField}
          value={address}
          error={error}
          onChange={(event) => (setAddress(event.target.value), setError(undefined))}
          onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), apply())}
        />
        <Box flexDirection="row" gap="1x" justifyContent="flex-end">
          {active ? (
            <Button variant="secondary" size="sm" onClick={remove}>
              Remove
            </Button>
          ) : null}
          <Button variant="primary" size="sm" onClick={apply}>
            Apply
          </Button>
        </Box>
      </Box>
    </Popover>
  );
}

export type EditorSelectionToolbarProps = { editor: Editor };

/**
 * The toolbar over a text selection, as the portfolio has it: text colour, highlight, a chip, then bold, italic,
 * underline, code and a link, and a button to close it. It is a popover anchored to the selected text that never takes focus, so typing
 * carries on; pressing in it does not blur the editor.
 */
export function EditorSelectionToolbar({ editor }: EditorSelectionToolbarProps) {
  const { rect, release } = useSelectionToolbar(editor);
  const anchor = useRef<HTMLSpanElement>(null);
  if (!rect) return null;

  const textColor = editor.getAttributes("textColor").color as string | undefined;
  const highlight = editor.isActive("highlight") ? (editor.getAttributes("highlight").color as string) : undefined;

  const close = () => {
    // Closing lets go of the selection, as Escape does in a text field: the caret goes to its end.
    release();
    editor.chain().focus().setTextSelection(editor.state.selection.to).run();
  };

  return (
    <Popover
      open
      anchorRef={anchor}
      trigger={<span ref={anchor} aria-hidden style={{ position: "fixed", left: rect.left, top: rect.top, width: rect.width, height: rect.height, pointerEvents: "none" }} />}
      placement="top"
      autoFocus={false}
      dismissible={false}
      returnFocusOnClose={false}
    >
      <Box
        role="toolbar"
        aria-label="Text formatting"
        flexDirection="row"
        alignItems="center"
        gap="0.5x"
        padding="0.5x"
        data-component="Editor.SelectionToolbar"
        // Pressing a button must not take the selection out of the editor; a text field in a popup still needs the press.
        onMouseDown={(event) => !(event.target as Element).closest("input, textarea") && event.preventDefault()}
        onKeyDown={(event) => event.key === "Escape" && close()}
      >
        <ColorPicker
          aria-label="Text colour"
          groups={TEXT_GRID}
          appearance="text"
          value={textColor}
          onValueChange={(value) => (value && value !== DEFAULT_TEXT_COLOR ? editor.chain().focus().setMark("textColor", { color: value }).run() : editor.chain().focus().unsetMark("textColor").run())}
          trigger={<IconButton aria-label="Text colour" variant="ghost" size="sm" selected={Boolean(textColor)} icon={<Icon name="format_color_text" />} />}
        />
        <ColorPicker
          aria-label="Highlight"
          groups={HIGHLIGHT_GRID}
          appearance="highlight"
          // Choosing the colour already chosen reports nothing, so taking a highlight off is its own choice: None.
          clearable
          value={highlight}
          onValueChange={(value) => (value ? editor.chain().focus().setMark("highlight", { color: value }).run() : editor.chain().focus().unsetMark("highlight").run())}
          trigger={<IconButton aria-label="Highlight" variant="ghost" size="sm" selected={Boolean(highlight)} icon={<Icon name="format_ink_highlighter" />} />}
        />
        <IconButton aria-label="Chip" variant="ghost" size="sm" selected={editor.isActive("chip")} icon={<Icon name="sell" />} onClick={() => editor.chain().focus().toggleMark("chip").run()} />
        {FORMATS.map(({ mark, label, icon }) => (
          <IconButton key={mark} aria-label={label} variant="ghost" size="sm" selected={editor.isActive(mark)} icon={<Icon name={icon} />} onClick={() => editor.chain().focus().toggleMark(mark).run()} />
        ))}
        <LinkButton editor={editor} />
        <IconButton aria-label="Close" variant="ghost" size="sm" icon={<Icon name="close" />} onClick={close} />
      </Box>
    </Popover>
  );
}
