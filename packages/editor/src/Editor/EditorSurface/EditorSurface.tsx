import { useRef } from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import { Box, Prose } from "@sragatiping/cuboid";
import inline from "../../styles/Inline.module.css";
import { EditorBlockGutter } from "./EditorBlockGutter";
import { EditorSelectionToolbar } from "./EditorSelectionToolbar";
import classes from "./EditorSurface.module.css";

export type EditorSurfaceProps = { editor: Editor; className?: string };

/** The editing surface: the document, the gutter beside whichever block the pointer is over, and the toolbar over a text selection. */
function EditorSurfaceRoot({ editor, className }: EditorSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Box ref={ref} position="relative" className={className} data-component="Editor.Surface">
      <Prose className={[classes.Surface, inline.Inline].join(" ")}>
        <EditorContent editor={editor} />
      </Prose>
      <EditorBlockGutter editor={editor} container={ref} />
      <EditorSelectionToolbar editor={editor} />
    </Box>
  );
}

/** The surface and what it owns: `EditorSurface.BlockGutter` beside a block, `EditorSurface.SelectionToolbar` over selected text. */
export const EditorSurface = Object.assign(EditorSurfaceRoot, { BlockGutter: EditorBlockGutter, SelectionToolbar: EditorSelectionToolbar });
