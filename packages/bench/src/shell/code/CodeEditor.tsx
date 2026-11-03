import React, { useEffect, useMemo, useRef } from "react";
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState, StateField, Transaction } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import { Decoration, EditorView, drawSelection, keymap, lineNumbers } from "@codemirror/view";
import { resolveSyntaxColors, useTokens } from "../../ui/index";
import type { Env } from "../../engine/content/check";
import { componentCompletions } from "./completions";
import { ghostText } from "./ghostText";
import type { Suggest } from "./ghostText";
import { elementAt } from "./jsx";
import type { JsxElement } from "./jsx";
import { markEffects, markedField, setMarked } from "./markedRanges";
import type { SourceRange } from "./markedRanges";
import { syntaxHighlighter } from "./syntax";
import { syntaxMarks } from "./syntaxMarks";
import { editorTheme } from "./theme";

/** The `<>` and `</>` the text is read inside of are not drawn: their lines are replaced by nothing. */
const hideFragment: Extension = StateField.define({
  create: (state) => hiddenLines(state),
  update: (_, transaction) => hiddenLines(transaction.state),
  provide: (field) => EditorView.decorations.from(field),
});

function hiddenLines(state: EditorState) {
  const first = state.doc.line(1);
  const last = state.doc.line(state.doc.lines);
  return Decoration.set([Decoration.replace({ block: true }).range(first.from, first.to + 1), Decoration.replace({ block: true }).range(last.from - 1, last.to)]);
}

export type CodeEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  /** No grammar: the text as it is (a stylesheet; only TypeScript and JSX have one here). */
  plain?: boolean;
  /** Long lines wrap, as they do in the Figma's source view, instead of scrolling sideways. */
  wrap?: boolean;
  /** The colour behind the code and its gutter, which are always the same: the surface the editor sits on. `subtle` is a well on the pane (the example's code); `default` is the pane itself (a file's source). @default "subtle" */
  surface?: "subtle" | "default";
  /** The text is several elements side by side (what is between a component's tags): they are read inside a fragment, which is not shown, so each parses as itself. */
  fragment?: boolean;
  /** Pieces of the code to mark from outside (what a part under the pointer was written as), with where each file line sits in `value`. */
  marked?: { ranges: SourceRange[]; lineOf?: (fileLine: number) => number | null } | null;
  /** The components, for suggestions: what a tag can be, and what props it takes. */
  env?: Env;
  /** Answers "what comes next?" for ghost text. Asked after you pause; given as a function so anything can answer. */
  suggest?: Suggest;
  /** Told which JSX element the cursor is in whenever that changes. */
  onCursorElement?: (element: JsxElement | null) => void;
  "aria-label": string;
};

/**
 * An editor for code, on CodeMirror: it parses and edits, and has the keys, the selection, the undo and the screen-reader support of an
 * editor. What is ours is how it joins the rest of the shell, each as a small seam: it is coloured by the interface kit's own syntax colours, it marks
 * what the page points at, it suggests from the components' models, it can show a suggestion from anywhere as ghost text, and it says
 * which element the cursor is in.
 */
export function CodeEditor({ value: shown, onChange, readOnly = false, plain = false, wrap = false, fragment = false, surface = "subtle", marked, env, suggest, onCursorElement, "aria-label": label }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  // Read inside a fragment, so adjacent elements parse as elements; the two lines of it are hidden, and the line numbers start at the first line shown.
  const value = fragment ? `<>\n${shown}\n</>` : shown;
  const tokens = useTokens();
  const colors = useMemo(() => resolveSyntaxColors(tokens, "typescript"), [tokens]);

  // What the editor calls out to is read when it is called, so a new function does not rebuild the editor.
  const latest = useRef({ onChange, suggest, onCursorElement });
  latest.current = { onChange, suggest, onCursorElement };

  const theme = useRef(new Compartment());
  const editable = useRef(new Compartment());
  const completion = useRef(new Compartment());

  useEffect(() => {
    let lastElement = "";
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          ...(fragment ? [hideFragment] : []),
          lineNumbers(fragment ? { formatNumber: (line) => String(line - 1) } : undefined),
          history(),
          drawSelection(),
          bracketMatching(),
          closeBrackets(),
          indentOnInput(),
          ...(plain ? [] : [javascript({ jsx: true, typescript: true })]),
          ...(wrap ? [EditorView.lineWrapping] : []),
          syntaxHighlighting(syntaxHighlighter),
          syntaxMarks,
          theme.current.of(editorTheme(colors)),
          editable.current.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
          completion.current.of(autocompletion({ override: env ? [componentCompletions(env)] : [], icons: false })),
          markedField,
          ghostText({ suggest: () => latest.current.suggest }),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap]),
          EditorView.contentAttributes.of({ "aria-label": label, "aria-multiline": "true" }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !update.transactions.every((tr) => tr.annotation(Transaction.remote))) latest.current.onChange?.(update.state.doc.toString());
            if (update.selectionSet || update.docChanged) {
              const element = elementAt(update.state, update.state.selection.main.head);
              const key = element ? `${element.tag}@${element.from}` : "";
              if (key !== lastElement) {
                lastElement = key;
                latest.current.onCursorElement?.(element);
              }
            }
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // Built once. Everything that can change afterwards is reconfigured or dispatched below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A new value from outside replaces the text; the change is marked remote, so it is not reported back as an edit.
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value }, annotations: Transaction.remote.of(true) });
  }, [value]);

  useEffect(() => void view.current?.dispatch({ effects: theme.current.reconfigure(editorTheme(colors)) }), [colors]);
  useEffect(() => void view.current?.dispatch({ effects: editable.current.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]) }), [readOnly]);
  useEffect(() => void view.current?.dispatch({ effects: completion.current.reconfigure(autocompletion({ override: env ? [componentCompletions(env)] : [], icons: false })) }), [env]);

  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    editor.dispatch({ effects: marked ? markEffects(editor.state.doc, marked.ranges, marked.lineOf) : [setMarked.of([])] });
  }, [marked, value]);

  return <div ref={host} data-component="Shell.CodeEditor" data-surface={surface} style={{ maxHeight: "100%", overflow: "auto", ["--editor-surface" as string]: `var(--cube-bgColor-canvas-${surface})` }} />;
}
