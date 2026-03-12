/**
 * Pure tree-layout utilities — no React, no DOM.
 *
 * Two layout strategies, both placing cards left-to-right without overlaps:
 *
 *  `treeLayout`           — centres each parent over its children group.
 *                           Good for balanced/symmetric trees.
 *
 *  `topAnchoredLayout`    — anchors each child's y to the top edge of the
 *                           object-row handle that connects to it in the parent.
 *                           Edges always flow left → down-right (never upward).
 *                           Good for JSON objects where reading order matters.
 *
 * Card height formula (shared):
 *   height = cardPadding + rowCount × rowHeight + (rowCount − 1) × rowGap
 */

// ── Shared types ──────────────────────────────────────────────────────────────

export interface LayoutOptions {
  /** Horizontal distance between column left-edges. Default: 420 */
  columnWidth?: number;
  /** Vertical gap between sibling cards in the same column. Default: 24 */
  siblingGap?: number;
  /** Card top + bottom padding combined (= GraphCard `padding × 2`). Default: 24 */
  cardPadding?: number;
  /** Approximate height of one row in pixels. Default: 29 */
  rowHeight?: number;
  /** Gap between rows inside a card (= GraphCard `gap`). Default: 4 */
  rowGap?: number;
}

export interface CardPosition {
  x: number;
  y: number;
}

// ── treeLayout types ──────────────────────────────────────────────────────────

export interface LayoutNode {
  id: string;
  /**
   * Total rows in this card — title + field rows + object rows.
   * All row types are treated as the same height for layout purposes.
   */
  rowCount: number;
  /** IDs of child cards, top-to-bottom order. */
  children?: string[];
}

// ── topAnchoredLayout types ───────────────────────────────────────────────────

export interface AnchoredChild {
  id: string;
  /**
   * 0-based index of the object-row in the parent card that connects to this
   * child. Count from the top: title = 0, first row = 1, etc.
   *
   * The child card is placed so its top-left corner aligns with (or is below)
   * the top edge of this row, creating a left→down-right edge flow.
   */
  handleRowIndex: number;
}

export interface AnchoredLayoutNode {
  id: string;
  /** Total rows in this card — title + field rows + object rows. */
  rowCount: number;
  children?: AnchoredChild[];
}

// ── treeLayout implementation ─────────────────────────────────────────────────

function estimateCardHeight(rowCount: number, opts: Required<LayoutOptions>): number {
  return (
    opts.cardPadding +
    rowCount * opts.rowHeight +
    (rowCount - 1) * opts.rowGap
  );
}

/**
 * Computes non-overlapping canvas positions for a tree of cards.
 *
 * @param nodes   All nodes in the tree (any order).
 * @param rootId  ID of the root node to start layout from.
 * @param options Visual tuning — defaults match GraphCard / JsonFieldRow tokens.
 * @returns       `Map<id, { x, y }>` — canvas-space positions ready to pass
 *                as `x` / `y` props to `<GraphCard>`.
 *
 * @example
 * ```ts
 * const pos = treeLayout([
 *   { id: "root", rowCount: 8, children: ["data", "key"] },
 *   { id: "data", rowCount: 13, children: ["battery", "ng"] },
 *   { id: "key",  rowCount: 9 },
 *   { id: "battery", rowCount: 3 },
 *   { id: "ng",      rowCount: 8 },
 * ], "root");
 *
 * const at = (id: string) => pos.get(id)!;
 * // <GraphCard id="root" x={at("root").x} y={at("root").y}>
 * ```
 */
export function treeLayout(
  nodes: LayoutNode[],
  rootId: string,
  options?: LayoutOptions,
): Map<string, CardPosition> {
  const opts: Required<LayoutOptions> = {
    columnWidth: 420,
    siblingGap:  24,
    cardPadding: 24,
    rowHeight:   29,
    rowGap:      4,
    ...options,
  };

  const nodeMap  = new Map(nodes.map(n => [n.id, n]));
  const positions = new Map<string, CardPosition>();

  /**
   * Recursive DFS layout.
   * @param id      Current node to place.
   * @param depth   Column index (0 = root column).
   * @param startY  Minimum y this subtree may occupy.
   * @returns       The y value where the next sibling subtree may start.
   */
  function layout(id: string, depth: number, startY: number): number {
    const node     = nodeMap.get(id);
    if (!node) return startY;

    const children = node.children ?? [];
    const h        = estimateCardHeight(node.rowCount, opts);
    const x        = depth * opts.columnWidth;

    if (children.length === 0) {
      // Leaf: place at startY
      positions.set(id, { x, y: startY });
      return startY + h + opts.siblingGap;
    }

    // Layout children top-to-bottom, collecting the span they occupy
    const childrenTop = startY;
    let childY = startY;
    for (const childId of children) {
      childY = layout(childId, depth + 1, childY);
    }
    const childrenBottom = childY - opts.siblingGap; // trim trailing gap

    // Centre this node over its children group, but never above startY
    const childrenMid = (childrenTop + childrenBottom) / 2;
    const y = Math.max(Math.round(childrenMid - h / 2), startY);

    positions.set(id, { x, y });

    // Next sibling may start after both this card and the children group end
    return Math.max(y + h, childrenBottom) + opts.siblingGap;
  }

  layout(rootId, 0, 0);
  return positions;
}

// ── topAnchoredLayout implementation ─────────────────────────────────────────

/**
 * Computes canvas positions for a tree where each child is anchored to the
 * top edge of the parent object-row that connects to it.
 *
 * This means edges always flow left → down-right: the bezier leaves the
 * parent handle at row N and arrives at the child card which starts at or
 * below that same y. Reading order (top-to-bottom) is preserved.
 *
 * A per-column `nextY` cursor prevents cards in the same column from
 * overlapping when a previous subtree pushes them further down.
 *
 * @param nodes   All nodes in the tree.
 * @param rootId  ID of the root node.
 * @param options Visual tuning — same defaults as `treeLayout`.
 *
 * @example
 * ```ts
 * const pos = topAnchoredLayout([
 *   { id: "root", rowCount: 8, children: [
 *       { id: "data", handleRowIndex: 6 },   // 6th row in root card
 *       { id: "key",  handleRowIndex: 7 },
 *   ]},
 *   { id: "data", rowCount: 13, children: [
 *       { id: "battery", handleRowIndex: 10 },
 *   ]},
 *   { id: "key",     rowCount: 9 },
 *   { id: "battery", rowCount: 3 },
 * ], "root");
 * ```
 */
export function topAnchoredLayout(
  nodes: AnchoredLayoutNode[],
  rootId: string,
  options?: LayoutOptions,
): Map<string, CardPosition> {
  const opts: Required<LayoutOptions> = {
    columnWidth: 420,
    siblingGap:  24,
    cardPadding: 24,
    rowHeight:   29,
    rowGap:      4,
    ...options,
  };

  const nodeMap   = new Map(nodes.map(n => [n.id, n]));
  const positions = new Map<string, CardPosition>();
  // Tracks the lowest occupied y-bottom in each column, so siblings never overlap.
  const colNextY  = new Map<number, number>();

  /** Top edge of row[rowIndex] inside a card whose top-left is at cardY. */
  function rowTopEdge(cardY: number, rowIndex: number): number {
    const paddingTop = opts.cardPadding / 2;          // assume symmetric padding
    return cardY + paddingTop + rowIndex * (opts.rowHeight + opts.rowGap);
  }

  function layout(id: string, depth: number, anchorY: number): void {
    const node = nodeMap.get(id);
    if (!node) return;

    const h = estimateCardHeight(node.rowCount, opts);
    const x = depth * opts.columnWidth;

    // Respect both the anchor from the parent and any prior sibling in this column
    const colMin = colNextY.get(depth) ?? 0;
    const y = Math.max(anchorY, colMin);

    positions.set(id, { x, y });
    colNextY.set(depth, y + h + opts.siblingGap);

    // Layout each child anchored to its object-row in this card
    for (const child of (node.children ?? [])) {
      const childAnchor = rowTopEdge(y, child.handleRowIndex);
      layout(child.id, depth + 1, childAnchor);
    }
  }

  layout(rootId, 0, 0);
  return positions;
}
