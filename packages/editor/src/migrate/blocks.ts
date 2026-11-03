import type { DocNode, Mark } from "../core";
import { mapHighlight, mapTextColor } from "./colors";
import { parseInline } from "./inline";
import type { LegacyBlock, Migrated, MigrationIssue } from "./legacy";
import { MAX_TABLE_COLUMNS } from "../constants";

/** Where a block lands. A column cannot hold columns; a callout holds neither columns nor another callout. */
type Inside = "page" | "column" | "callout";

type Context = { issues: MigrationIssue[] };

const paragraph = (content: DocNode[] = []): DocNode => (content.length ? { type: "paragraph", content } : { type: "paragraph" });

const note = (ctx: Context, block: LegacyBlock, kind: MigrationIssue["kind"], message: string) => ctx.issues.push({ blockId: block.id, tag: block.tag, kind, message });

function json(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** A text block's own props (colour, weight, italic, underline) become marks over its whole text. What has no mark is reported, not hidden. */
function propMarks(block: LegacyBlock, ctx: Context): Mark[] {
  const props = block.props ?? {};
  const marks: Mark[] = [];
  if (props.color) {
    const color = mapTextColor(props.color);
    if (color) marks.push({ type: "textColor", attrs: { color } });
    else note(ctx, block, "dropped", `The text colour "${props.color}" is not a colour the new palette has.`);
  }
  if (props.weight === "bold" || props.weight === "semibold") marks.push({ type: "bold" });
  if (props.italic === "true") marks.push({ type: "italic" });
  if (props.underline === "true") marks.push({ type: "underline" });
  if (props.align && props.align !== "left") note(ctx, block, "dropped", `Text alignment "${props.align}" has no place in the new document yet.`);
  if (props.monospace === "true") note(ctx, block, "dropped", "Monospace text is now what a code block is for.");
  return marks;
}

type TreeNode = { title?: unknown; children?: unknown };
type LegacyColumn = { width?: number; blocks?: LegacyBlock[] };

/** A list's items: the recursive shape (`{ title, children }`) or the older flat one (a string each). */
function listItems(raw: unknown, type: "bulletList" | "orderedList"): DocNode[] {
  const items = Array.isArray(raw) ? raw : [];
  return items.map((item: TreeNode | string) => {
    const title = typeof item === "string" ? item : typeof item?.title === "string" ? item.title : "";
    const children = typeof item === "object" && item && Array.isArray(item.children) ? item.children : [];
    const content: DocNode[] = [paragraph(parseInline(title))];
    if (children.length) content.push({ type, content: listItems(children, type) });
    return { type: "listItem", content };
  });
}

/** An outline's items: a title (marked text) and the items under it, to any depth the old page had. */
function outlineItems(raw: unknown): DocNode[] {
  const items = Array.isArray(raw) ? raw : [];
  return items.map((item: TreeNode | string) => {
    const title = typeof item === "string" ? item : typeof item?.title === "string" ? item.title : "";
    const children = typeof item === "object" && item && Array.isArray(item.children) ? outlineItems(item.children) : [];
    return { type: "outlineItem", content: [paragraph(parseInline(title)), ...(children.length ? [{ type: "outlineTree", content: children }] : [])] };
  });
}

function legacy(block: LegacyBlock, ctx: Context): DocNode {
  note(ctx, block, "unsupported", `A "${block.tag}" block has no counterpart yet: it is kept whole as a legacy block.`);
  return { type: "legacy", attrs: { tag: block.tag, variant: block.variant ?? null, props: block.props ?? {}, children: block.children } };
}

function convert(block: LegacyBlock, ctx: Context, inside: Inside): DocNode[] {
  const marks = () => propMarks(block, ctx);
  switch (block.tag) {
    case "p":
      return [paragraph(parseInline(block.children, marks()))];

    case "h": {
      const level = Math.min(3, Math.max(1, Number(block.variant) || 1));
      const content = parseInline(block.children, marks());
      return [{ type: "heading", attrs: { level }, ...(content.length ? { content } : {}) }];
    }

    case "code": {
      const language = block.props?.language;
      return [{ type: "codeBlock", attrs: { language: language === "json" ? "javascript" : (language ?? "text") }, ...(block.children ? { content: [{ type: "text", text: block.children }] } : {}) }];
    }

    case "divider":
      return [{ type: "divider" }];

    case "img": {
      const props = block.props ?? {};
      const width = Number.parseFloat(String(props.width ?? ""));
      return [{ type: "image", attrs: { src: String(props.src ?? ""), alt: String(props.alt ?? ""), caption: String(props.caption ?? ""), width: Number.isFinite(width) ? Math.min(100, Math.max(20, width)) : 100, bordered: props.border !== "false" } }];
    }

    case "embed": {
      const props = block.props ?? {};
      const height = props.height ?? "";
      // The chip's own words, icon, pill and colours were the author's dressing of one link; a link's title and icon now come from what resolves it.
      const dressing = ["title", "iconLeft", "pill", "pillVariant", "background", "borderColor"].filter((name) => props[name]);
      if (dressing.length) note(ctx, block, "dropped", `The link's own ${dressing.join(", ")} have no place in the new link block: its title and icon come from the link.`);
      return [{ type: "smartLink", attrs: { url: String(props.src ?? ""), appearance: props.style === "inline" ? "inline" : "embed", height: ["auto", "sm", "md", "lg", "16:9", "4:3"].includes(height) ? height : "" } }];
    }

    case "list": {
      const type = block.variant === "numbered" ? "orderedList" : "bulletList";
      const raw = json(block.children) as { items?: unknown } | undefined;
      const items = listItems(raw?.items, type);
      return [{ type, content: items.length ? items : [{ type: "listItem", content: [paragraph()] }] }];
    }

    // Saved pages carry the older name `numberedTree` too.
    case "outlineTree":
    case "numberedTree": {
      const raw = json(block.children) as { items?: unknown } | undefined;
      const items = outlineItems(raw?.items);
      return [{ type: "outlineTree", content: items.length ? items : [{ type: "outlineItem", content: [paragraph()] }] }];
    }

    case "table": {
      const raw = json(block.children) as { rows?: unknown; colWidths?: unknown } | undefined;
      const rows = (Array.isArray(raw?.rows) ? raw.rows : []).map((r) => (Array.isArray(r) ? r.map((c) => (typeof c === "string" ? c : "")) : []));
      const width = Math.min(MAX_TABLE_COLUMNS, Math.max(1, ...rows.map((r) => r.length)));
      if (rows.some((r) => r.length > MAX_TABLE_COLUMNS)) note(ctx, block, "dropped", `A table has at most ${MAX_TABLE_COLUMNS} columns: the cells past them are not kept.`);
      if (Array.isArray(raw?.colWidths) && new Set(raw.colWidths).size > 1) note(ctx, block, "dropped", "Column widths are not kept yet: the columns share the width equally.");
      const cell = (text: string): DocNode => {
        const content = parseInline(text);
        return { type: "tableCell", ...(content.length ? { content } : {}) };
      };
      // A short row is filled out, as a table is always a grid. The old table had no header row, so none is made.
      const body = (rows.length ? rows : [[]]).map((r): DocNode => ({ type: "tableRow", content: Array.from({ length: width }, (_, i) => cell(r[i] ?? "")) }));
      return [{ type: "table", content: body }];
    }

    case "callout": {
      const parsed = json(block.children) as { blocks?: LegacyBlock[] } | undefined;
      // The older shape is the callout's own text; the newer one is a list of blocks.
      const inner = Array.isArray(parsed?.blocks) ? convertAll(parsed.blocks, ctx, "callout") : block.children.trim() ? [paragraph(parseInline(block.children))] : [];
      // The old background is an id in its own palette; the nearest of Cuboid's highlight colours is used (a surface that is not a highlight is neutral).
      const color = block.props?.background ? mapHighlight(block.props.background) : "neutral";
      const bordered = block.props?.border === "true";
      if (inside === "callout") {
        note(ctx, block, "approximated", "A callout inside a callout is flattened: the inner one's content is kept.");
        return inner;
      }
      return [{ type: "callout", attrs: { color, bordered }, content: inner.length ? inner : [paragraph()] }];
    }

    case "box": {
      const parsed = json(block.children) as { columns?: LegacyColumn[] } | undefined;
      const columns: LegacyColumn[] = Array.isArray(parsed?.columns) ? parsed.columns : Array.from({ length: Math.min(4, Math.max(2, Number(block.variant) || 2)) }, () => ({}));
      if (inside !== "page") {
        note(ctx, block, "approximated", "Columns inside a column or a callout are flattened: their content is kept, one column after another.");
        return columns.flatMap((c) => convertAll(c.blocks ?? [], ctx, inside));
      }
      if (columns.length > 4) note(ctx, block, "dropped", `Only 4 columns are kept; ${columns.length - 4} were left out.`);
      const kept = columns.slice(0, 4);
      while (kept.length < 2) kept.push({});
      return [
        {
          type: "columns",
          content: kept.map((c) => {
            const inner = convertAll(c.blocks ?? [], ctx, "column");
            return { type: "column", attrs: { flex: typeof c.width === "number" && c.width > 0 ? c.width : 1 }, content: inner.length ? inner : [paragraph()] };
          }),
        },
      ];
    }

    default:
      return [legacy(block, ctx)];
  }
}

function convertAll(blocks: LegacyBlock[], ctx: Context, inside: Inside): DocNode[] {
  return blocks.flatMap((block) => convert(block, ctx, inside));
}

/**
 * Turns a page of the old editor's blocks into a document. Text, headings, lists, code, dividers, callouts and columns are converted;
 * anything else is kept whole in a `legacy` block and reported, so a migration never drops content. The issues say what was kept in a
 * nearer form or left out, block by block.
 */
export function migrateBlocks(blocks: LegacyBlock[]): Migrated {
  const ctx: Context = { issues: [] };
  const content = convertAll(blocks, ctx, "page");
  return { doc: { type: "doc", content: content.length ? content : [paragraph()] }, issues: ctx.issues };
}
