import type { Node, Value } from "../engine/types";

/**
 * What Bench and the page inside a frame say to each other. The page is on the same origin, so Bench calls it directly rather than by
 * messages: the page puts `Bench` on its window, and Bench holds the iframe and calls `show`. What is passed is plain data (and the
 * `Map` of where each element is written), so nothing of Bench's interface goes in: the page draws it with the library alone.
 */
export type Shown =
  | {
      /** The example to draw. */
      node: Node;
      /** Where each of its elements is written in the code (`printExample`), put on the element as `data-src`. */
      sources: Map<Node, string>;
    }
  | {
      /** An example someone wrote: the export `example` of the component's `examples` file. The page loads and draws it, since it is code, not data. */
      authored: { component: string; example: string };
    };

export type FramePage = {
  /** Draws this, in place of what was drawn. */
  show(content: Shown | null): void;
  /** Sets what the pane changed on the example's instances, each by where it is written (`"line:column"`); the example is drawn again with them. */
  edit(patches: Record<string, Record<string, Value | undefined>>): void;
};

/** The page's window, as Bench sees it. */
export type FrameWindow = Window & { Bench?: FramePage };
