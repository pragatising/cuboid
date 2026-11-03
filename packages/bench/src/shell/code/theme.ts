import { EditorView } from "@codemirror/view";
import type { SyntaxColors } from "../../ui/index";
import { syntaxStyles } from "./syntax";

/** The look of the editor, in the kit's variables (so it follows the mode) and the code colours it is given. */
export const editorTheme = (colors: SyntaxColors) =>
  EditorView.theme({
    // One surface for the editor and its gutter (`--editor-surface`, set by the CodeEditor from its `surface`): they are always the same colour.
    "&": { font: "12px/20px var(--cube-fontStack-monospace)", color: "var(--cube-fgColor-neutral-default)", backgroundColor: "var(--editor-surface, transparent)" },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": { fontFamily: "inherit", lineHeight: "inherit" },
    ".cm-content": { padding: "4px 0", caretColor: "var(--cube-fgColor-neutral-contrast)" },
    ".cm-line": { padding: "0 12px 0 0", borderLeft: "3px solid transparent" },
    // The gutter has the surface's own colour, not none: code scrolled sideways passes under it (it stays put), and must not show through the numbers.
    ".cm-gutters": { backgroundColor: "var(--editor-surface, var(--cube-bgColor-canvas-subtle))", border: "0", color: "var(--cube-fgColor-neutral-subtle)" },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 12px 0 8px", minWidth: "32px" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "var(--cube-highlight-blue-bgColor)" },
    // What an outside part is written as: the piece in the shell's annotation blue, and a quiet edge on its row (as the example pane draws it).
    ".cm-marked": { backgroundColor: "rgba(40, 108, 253, 0.22)" },
    ".cm-marked-line": { borderLeftColor: "#286cfd", backgroundColor: "rgba(40, 108, 253, 0.05)" },
    // What a suggestion would write, ahead of the caret, until it is accepted.
    ".cm-ghost": { color: "var(--cube-fgColor-neutral-disabled)", pointerEvents: "none" },
    ".cm-tooltip": { backgroundColor: "var(--cube-bgColor-canvas-default)", border: "1px solid var(--cube-borderColor-muted)", borderRadius: "var(--cube-borderRadius-md)", boxShadow: "var(--cube-shadow-floating-sm)", overflow: "hidden" },
    ".cm-tooltip-autocomplete > ul": { fontFamily: "inherit", maxHeight: "16rem" },
    ".cm-tooltip-autocomplete > ul > li": { padding: "2px 8px" },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "var(--cube-bgColor-informational-subtle)", color: "var(--cube-fgColor-neutral-contrast)" },
    ".cm-completionDetail": { color: "var(--cube-fgColor-neutral-muted)", marginLeft: "8px", fontStyle: "normal" },
    ".cm-completionInfo": { padding: "6px 8px", maxWidth: "20rem", whiteSpace: "normal", font: "12px/18px var(--cube-fontStack-monospace)" },
    ...syntaxStyles(colors),
  });
