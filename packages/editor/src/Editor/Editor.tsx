import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import type { EditorState } from "@tiptap/pm/state";
import { useEditor } from "@tiptap/react";
import { Box } from "@sragatiping/cuboid";
import { ImageUpload } from "../blocks/image";
import { EditorSurface } from "./EditorSurface";
import { EditorTitle } from "./EditorTitle";
import type { DocNode } from "../core";
import { Read } from "../read/Read";
import { focusEnd } from "../write/exits";
import { extensionsFor } from "../write/extensions";
import { SlashCommand } from "../write/slash";

/** How wide the column the page is written in is. */
export type EditorWidth = "narrow" | "wide" | "full";

const COLUMN_WIDTH: Record<EditorWidth, string> = { narrow: "584px", wide: "792px", full: "90vw" };

export type EditorProps = Omit<ComponentPropsWithRef<"div">, "children" | "defaultValue" | "onChange" | "color" | "title"> & {
  /** The page to start from, as the JSON the editor keeps. Without one it is an empty page. The editor owns the document from there and reports it with `onChange`. */
  defaultValue?: DocNode;
  /** Called with the document as it changes. */
  onChange?: (doc: DocNode) => void;
  /** The page's name, above the document and not part of it. Without `title` the editor keeps it (from `defaultTitle`) and reports it with `onTitleChange`. */
  title?: string;
  defaultTitle?: string;
  onTitleChange?: (title: string) => void;
  /** How wide the column is: `narrow` is 584px, `wide` is 792px, `full` is 90vw; the column keeps that width whatever its container. @default "narrow" */
  width?: EditorWidth;
  /** View only: the page drawn from its JSON as a reader gets it, with no editing and no editing engine's DOM. @default false */
  readOnly?: boolean;
  /** Names the page for assistive technology: it is the editable region's name. @default "Document" */
  "aria-label"?: string;
  /** Where a picture's file goes: it takes the file and returns the address to keep. Without it a picture keeps the file's own data URL. */
  onUpload?: (file: File) => Promise<string>;
};

/** Whether the cursor is at the very start of the page: the start of the first block, however deep. */
const atStartOfPage = (state: EditorState) => {
  const { $from, empty } = state.selection;
  if (!empty || $from.parentOffset !== 0) return false;
  for (let depth = 0; depth <= $from.depth; depth++) if ($from.index(depth) !== 0) return false;
  return true;
};

/**
 * A page you write and read: its name, then the document. Editing, you type, press `/` to add blocks, select text to format it, and use the handle
 * beside a block to move, change or remove it; a click below the last block, or ArrowDown past it, goes to a paragraph there (one is added when
 * the page ends in a block that is not text), and ArrowUp from the first block goes to the title. View only, the same page is drawn as a reader
 * gets it. It is at least 720px tall, so the empty page below the writing is a place to click. It is Cuboid's `Prose` text and a Cuboid component
 * for each block, and keeps nothing but the title and the document. It leaves room at the column's sides for the handle that hangs beside a block.
 */
function EditorRoot({ defaultValue, onChange, title: titleProp, defaultTitle = "", onTitleChange, width = "narrow", readOnly = false, onUpload, "aria-label": ariaLabel = "Document", ...props }: EditorProps) {
  const start = useMemo<DocNode>(() => defaultValue ?? { type: "doc", content: [{ type: "paragraph" }] }, [defaultValue]);
  const [doc, setDoc] = useState<DocNode>(start);
  const [ownTitle, setOwnTitle] = useState(defaultTitle);
  const title = titleProp ?? ownTitle;
  const titleField = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [...extensionsFor(), SlashCommand],
    content: start,
    editable: !readOnly,
    // The editable region is a multi-line text box, named: a labelled region needs the role that allows a label.
    editorProps: {
      attributes: { role: "textbox", "aria-multiline": "true", "aria-label": ariaLabel },
      // ArrowUp from the very start of the page goes to the title, as ArrowDown from the title comes to the page.
      handleKeyDown: (view, event) => {
        if (event.key !== "ArrowUp" || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey || !atStartOfPage(view.state) || !titleField.current) return false;
        event.preventDefault();
        const field = titleField.current;
        field.focus();
        const range = document.createRange();
        range.selectNodeContents(field);
        range.collapse(false);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
        return true;
      },
    },
    onUpdate: ({ editor: next }) => {
      const json = next.getJSON() as DocNode;
      setDoc(json);
      onChange?.(json);
    },
  });
  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  // The column is exactly this wide and does not shrink with its container.
  const columnWidth = COLUMN_WIDTH[width];

  return (
    <Box data-component="Editor" data-width={width} minHeight="720px" paddingInline="7x" {...props}>
      <Box width={columnWidth} flexShrink={0} marginInline="auto" flexGrow={1} gap="1x">
        <EditorTitle
          ref={titleField}
          value={title}
          readOnly={readOnly}
          onChange={(next) => {
            setOwnTitle(next);
            onTitleChange?.(next);
          }}
          onExit={() => editor?.chain().focus("start").run()}
        />
        <Box
          flexGrow={1}
          // The empty page below the last block is a place to click: it goes to the end of the page.
          onMouseDown={(event: React.MouseEvent) => {
            if (!readOnly && editor && event.target === event.currentTarget) {
              event.preventDefault();
              focusEnd(editor);
            }
          }}
        >
          {readOnly ? (
            <Read node={doc} />
          ) : editor ? (
            <ImageUpload.Provider value={onUpload}>
              <EditorSurface editor={editor} />
            </ImageUpload.Provider>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

/** The page, and the parts it is made of, for a host that lays out its own page: `Editor.Title` and `Editor.Surface` (which owns its gutter and selection toolbar). */
export const Editor = Object.assign(EditorRoot, { Title: EditorTitle, Surface: EditorSurface });
