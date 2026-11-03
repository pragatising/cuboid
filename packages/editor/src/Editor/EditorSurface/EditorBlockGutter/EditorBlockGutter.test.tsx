import { act } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import type { DocNode } from "../../../core";
import { extensionsFor } from "../../../write/extensions";
import { GUTTER_HIDE_MS, GUTTER_HOLD_MS } from "./layout";
import { EditorSurface } from "../EditorSurface";

const para = (value: string): DocNode => ({ type: "paragraph", content: [{ type: "text", text: value }] });
const labels = (editor: Editor) => (editor.getJSON().content ?? []).map((n) => n.content?.[0]?.text ?? n.type);

let editor: Editor;
afterEach(() => editor?.destroy());

/**
 * Mounts a page of blocks. jsdom has no layout, so the pointer is mapped to a block by hand: a y of 0 is the first block, 100 the
 * second, 200 the third. Everything after that (the gutter, its menus, the commands) is the real thing.
 */
function mountNodes(nodes: DocNode[]) {
  editor = new Editor({ extensions: extensionsFor(), content: { type: "doc", content: nodes } });
  render(<EditorSurface editor={editor} />);
  vi.spyOn(editor.view, "posAtCoords").mockImplementation(({ top }) => {
    let start = 0;
    const index = Math.min(Math.floor(top / 100), nodes.length - 1);
    for (let i = 0; i < index; i++) start += editor.state.doc.child(i).nodeSize;
    return { pos: start + 1, inside: start };
  });
  const surface = document.querySelector<HTMLElement>('[data-component="Editor.Surface"]')!;
  // jsdom has no layout: give the surface a box, 500px wide with its left edge at 200px, and 100px for each block.
  const box = { left: LEFT, right: LEFT + 500, top: 0, bottom: nodes.length * 100, x: LEFT, y: 0, width: 500, height: nodes.length * 100, toJSON: () => ({}) } as DOMRect;
  vi.spyOn(surface, "getBoundingClientRect").mockReturnValue(box);
  return {
    /** The pointer at `y`, over the text. */
    over: (y: number, x = LEFT + 50) => fireEvent.mouseMove(surface, { clientX: x, clientY: y }),
    /** The pointer at `y`, over the page's margin beside the text: not inside the editor at all. */
    beside: (y: number, x: number) => fireEvent.mouseMove(document.body, { clientX: x, clientY: y }),
    surface,
  };
}

const mount = (...blocks: string[]) => mountNodes(blocks.map(para));

const LEFT = 200;
const gutter = () => document.querySelector('[data-component="Editor.BlockGutter"]');

describe("the block gutter", () => {
  it("appears beside the block the pointer is over, with its two buttons", () => {
    const { over } = mount("one", "two");
    expect(gutter()).toBeNull();
    over(0);
    expect(gutter()).not.toBeNull();
    expect(within(gutter() as HTMLElement).getByRole("button", { name: "Turn into" })).toBeInTheDocument();
    expect(within(gutter() as HTMLElement).getByRole("button", { name: "Actions" })).toBeInTheDocument();
  });

  describe("reach", () => {
    it("is found from the margin beside the block, not only from over its text", () => {
      const { beside } = mount("one", "two");
      beside(40, LEFT - 60);
      expect(gutter()).not.toBeNull();
    });

    it("is found at any height along the block: the top, the middle and the bottom", () => {
      const { over } = mount("one", "two");
      for (const y of [2, 50, 98]) {
        over(y);
        expect(gutter(), `y=${y}`).not.toBeNull();
      }
    });

    it("acts on the block the pointer is level with as it moves down the margin", async () => {
      const { beside } = mount("one", "two", "three");
      beside(10, LEFT - 60);
      beside(110, LEFT - 60);
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Actions" }));
      await user.click(screen.getByRole("menuitem", { name: "Delete block" }));
      expect(labels(editor)).toEqual(["one", "three"]);
    });

    it("stops at the edge of the reach: further left than that is the page, not a block", () => {
      vi.useFakeTimers();
      try {
        const { over, beside } = mount("one");
        over(10);
        beside(10, LEFT - 500);
        act(() => void vi.advanceTimersByTime(GUTTER_HIDE_MS + 10));
        expect(gutter()).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it("is not found from above or below the page", () => {
      vi.useFakeTimers();
      try {
        const { over, beside } = mount("one");
        over(10);
        beside(5000, LEFT + 50);
        act(() => void vi.advanceTimersByTime(GUTTER_HIDE_MS + 10));
        expect(gutter()).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it("checks the block's current type in the turn-into menu, and turns it into the one chosen", async () => {
    const { over } = mount("one", "two");
    over(0);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Turn into" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "Paragraph" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Heading 2" }));
    expect(editor.getJSON().content![0]).toMatchObject({ type: "heading", attrs: { level: 2 } });
    expect(editor.getJSON().content![1].type).toBe("paragraph");
    expect(gutter()).not.toBeNull();
  });

  it("moves a block down through its actions, and the gutter follows the block", async () => {
    const { over } = mount("one", "two", "three");
    over(0);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Move down" }));
    expect(labels(editor)).toEqual(["two", "one", "three"]);
    expect(gutter()).not.toBeNull();
    // The block is selected, as it is while its actions are open.
    expect(editor.state.selection.constructor.name).toBe("NodeSelection");
  });

  it("disables moving the first block up and the last block down", async () => {
    const { over } = mount("one", "two");
    over(0);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "Move up" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Move down" })).not.toHaveAttribute("aria-disabled", "true");
  });

  it("deletes a block and goes away", async () => {
    const { over } = mount("one", "two");
    over(100);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete block" }));
    expect(labels(editor)).toEqual(["one"]);
    expect(gutter()).toBeNull();
  });

  it("selects the block while its actions are open", async () => {
    const { over } = mount("one", "two");
    over(100);
    await userEvent.setup().click(screen.getByRole("button", { name: "Actions" }));
    expect(editor.state.selection.from).toBe(editor.state.doc.child(0).nodeSize);
    expect(editor.state.selection.constructor.name).toBe("NodeSelection");
  });

  it("makes the grip a drag handle", () => {
    const { over } = mount("one", "two");
    over(0);
    expect(screen.getByRole("button", { name: "Actions" })).toHaveAttribute("draggable", "true");
  });

  describe("timing", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("lingers after the pointer leaves, so it can be reached, then goes", () => {
      const { over } = mount("one");
      over(0);
      fireEvent.mouseOut(document.body, { relatedTarget: null });
      expect(gutter()).not.toBeNull();
      act(() => void vi.advanceTimersByTime(GUTTER_HIDE_MS + 10));
      expect(gutter()).toBeNull();
    });

    it("stays while the pointer is on it", () => {
      const { over } = mount("one");
      over(0);
      fireEvent.mouseOut(document.body, { relatedTarget: null });
      fireEvent.mouseEnter(gutter() as HTMLElement);
      act(() => void vi.advanceTimersByTime(GUTTER_HIDE_MS * 4));
      expect(gutter()).not.toBeNull();
    });

    it("waits for the pointer to rest on the block being typed in", () => {
      const { over } = mount("one", "two");
      editor.view.focus();
      editor.commands.setTextSelection(2); // the caret is in the first block
      over(0);
      expect(gutter()).toBeNull();
      act(() => void vi.advanceTimersByTime(GUTTER_HOLD_MS + 10));
      expect(gutter()).not.toBeNull();
    });

    it("shows at once on a block that is not being typed in", () => {
      const { over } = mount("one", "two");
      editor.view.focus();
      editor.commands.setTextSelection(2);
      over(100);
      expect(gutter()).not.toBeNull();
    });
  });
});

describe("a callout's own actions", () => {
  const callout = (color = "neutral", bordered = false): DocNode => ({ type: "callout", attrs: { color, bordered }, content: [para("inside"), para("more")] });
  /** Whether the named items are in the menu, in that order and with nothing between them or around them (icons are part of an item's text, so names are matched, not text). */
  const inOrder = (names: string[]) => {
    const items = screen.getAllByRole("menuitem");
    return items.length === names.length && names.every((name, i) => items[i] === screen.getByRole("menuitem", { name }));
  };
  const openActions = async (over: (y: number) => void) => {
    over(0);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Actions" }));
    return user;
  };

  it("lists its colour first and removing it last, around move and delete, and a paragraph has neither", async () => {
    const { over } = mountNodes([callout(), para("plain")]);
    await openActions(over);
    expect(inOrder(["Callout color & border", "Move up", "Move down", "Delete block", "Remove callout (keep contents)"])).toBe(true);
  });

  it("offers neither on a block that is not a callout", async () => {
    const { over } = mountNodes([para("plain")]);
    await openActions(over);
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    expect(screen.queryByRole("menuitem", { name: /Callout/ })).toBeNull();
    expect(inOrder(["Move up", "Move down", "Delete block"])).toBe(true);
  });

  it("opens one panel for the colour and the border, with the same swatches as a pill and a switch under them", async () => {
    const { over } = mountNodes([callout("blue")]);
    const user = await openActions(over);
    await user.click(screen.getByRole("menuitem", { name: "Callout color & border" }));
    const panel = await screen.findByRole("dialog", { name: "Callout color and border" });
    expect(within(panel).getByRole("radio", { name: "Blue" })).toHaveAttribute("aria-checked", "true");
    expect(within(panel).getAllByRole("radio")[0]).toHaveAttribute("data-appearance", "highlight");
    expect(within(panel).getByRole("switch", { name: "Border" })).not.toBeChecked();
    expect(within(panel).queryByRole("textbox")).toBeNull();
  });

  it("changes the colour and the border in place, keeping the callout selected and the panel open", async () => {
    const { over } = mountNodes([callout()]);
    const user = await openActions(over);
    await user.click(screen.getByRole("menuitem", { name: "Callout color & border" }));
    const panel = await screen.findByRole("dialog", { name: "Callout color and border" });
    await user.click(within(panel).getByRole("radio", { name: "Green" }));
    expect(editor.getJSON().content![0].attrs).toEqual({ color: "green", bordered: false });
    await user.click(within(panel).getByRole("switch", { name: "Border" }));
    expect(editor.getJSON().content![0].attrs).toEqual({ color: "green", bordered: true });
    expect(screen.getByRole("dialog", { name: "Callout color and border" })).toBeInTheDocument();
    expect(editor.state.selection.constructor.name).toBe("NodeSelection");
    expect(gutter()).not.toBeNull();
  });

  it("removes the callout and keeps what was in it", async () => {
    const { over } = mountNodes([callout(), para("after")]);
    const user = await openActions(over);
    await user.click(screen.getByRole("menuitem", { name: "Remove callout (keep contents)" }));
    expect(labels(editor)).toEqual(["inside", "more", "after"]);
  });
});
