import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { SlashMenu, optionId } from "./SlashMenu";
import { BLOCK_TYPES, matchBlockTypes } from "../blockTypes";
import type { BlockType } from "../blockTypes";


/** Whether the line the cursor is in sits where a block can go: its container takes a paragraph in its place. */
function holdsBlocksHere(editor: Editor): boolean {
  const { $from } = editor.state.selection;
  if ($from.depth === 0) return true;
  const container = $from.node($from.depth - 1);
  const index = $from.index($from.depth - 1);
  return container.canReplaceWith(index, index, editor.schema.nodes.paragraph);
}

/** Runs the menu for the Suggestion plugin: mounts it on the first match, redraws on every keystroke, and handles the keys. */
export function slashRenderer(editor: Editor) {
  let root: Root | null = null;
  let host: HTMLElement | null = null;
  let current: SuggestionProps<BlockType, BlockType> | null = null;
  let active = 0;

  const aria = (on: boolean) => {
    const dom = editor.view.dom;
    for (const name of ["aria-haspopup", "aria-expanded", "aria-activedescendant"]) dom.removeAttribute(name);
    if (!on) return;
    dom.setAttribute("aria-haspopup", "listbox");
    dom.setAttribute("aria-expanded", "true");
    if (current?.items.length) dom.setAttribute("aria-activedescendant", optionId(active));
  };

  const draw = () => {
    if (!root || !current) return;
    const props = current;
    root.render(<SlashMenu items={props.items} active={active} anchor={props.clientRect?.() ?? null} onPick={(type) => props.command(type)} />);
    aria(true);
  };

  return {
    onStart(props: SuggestionProps<BlockType, BlockType>) {
      host = document.createElement("div");
      document.body.append(host);
      root = createRoot(host);
      current = props;
      active = 0;
      draw();
    },
    onUpdate(props: SuggestionProps<BlockType, BlockType>) {
      current = props;
      active = Math.min(active, Math.max(0, props.items.length - 1));
      draw();
    },
    onKeyDown({ event }: SuggestionKeyDownProps) {
      const count = current?.items.length ?? 0;
      if (event.key === "ArrowDown" && count) return (active = (active + 1) % count), draw(), true;
      if (event.key === "ArrowUp" && count) return (active = (active - 1 + count) % count), draw(), true;
      if (event.key === "Enter" && count && current) return current.command(current.items[active]), true;
      return false;
    },
    onExit() {
      aria(false);
      root?.unmount();
      host?.remove();
      root = host = current = null;
    },
  };
}

/** Type `/` to insert or turn the current line into a block. The editor keeps focus the whole time, and one undo reverses the choice. */
export const SlashCommand = Extension.create<{ types: BlockType[] }>({
  name: "slashCommand",
  addOptions: () => ({ types: BLOCK_TYPES }),
  addProseMirrorPlugins() {
    return [
      Suggestion<BlockType, BlockType>({
        editor: this.editor,
        char: "/",
        // Marks the query being typed, so the block it is in can take the inset surface and the query its colour (Inline.module.css).
        decorationClass: "cuboid-slash",
        // Where a block cannot go (a table's cell is one line of inline content), only what goes inside a line is offered.
        items: ({ query, editor }) => matchBlockTypes(query, this.options.types).filter((type) => type.group === "inline" || holdsBlocksHere(editor)),
        // The `/query` is removed and the type applied in one chain, so one undo reverses both.
        command: ({ editor, range, props }) => void props.apply(editor.chain().focus().deleteRange(range)).run(),
        render: () => slashRenderer(this.editor),
      }),
    ];
  },
});
