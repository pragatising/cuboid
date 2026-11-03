// The read entry. React, Cuboid and the block contract only: nothing from the editing engine.
import type { ReactNode } from "react";
import { Highlight, OutlineTree, Pill, Prose, Table } from "@sragatiping/cuboid";
import type { DocNode, Mark, ReadRegistry } from "../core";
import { readBlocks } from "../blocks/read";
import { isHighlightName, isTextColor, textColorVar } from "../utils/palette";
import { safeHref } from "../utils/link";
import proseInline from "../styles/Inline.module.css";
import { formatDate, isPillIntensity, isPillShade } from "../utils/inline";
import { plainText } from "./plainText";

const mark = (m: Mark, inner: ReactNode, key: number): ReactNode => {
  switch (m.type) {
    case "bold": return <strong key={key}>{inner}</strong>;
    case "italic": return <em key={key}>{inner}</em>;
    case "code": return <code key={key}>{inner}</code>;
    case "underline": return <u key={key}>{inner}</u>;
    case "chip": return <span key={key} data-chip="">{inner}</span>;
    case "strike": return <s key={key}>{inner}</s>;
    // Only palette names reach the page as colours, and only safe addresses as links: a stored document is not trusted to style or script it.
    case "textColor": return isTextColor(m.attrs?.color) ? <span key={key} style={{ color: textColorVar(m.attrs.color), ["--editor-chip-color" as string]: textColorVar(m.attrs.color) }}>{inner}</span> : inner;
    case "highlight": return <Highlight key={key} color={isHighlightName(m.attrs?.color) ? m.attrs.color : "yellow"}>{inner}</Highlight>;
    case "link": {
      const href = safeHref(String(m.attrs?.href ?? ""));
      return href ? <a key={key} href={href} rel="noopener noreferrer nofollow">{inner}</a> : inner;
    }
    default: return inner;
  }
};

const inline = (node: DocNode, key: number): ReactNode =>
  node.type === "hardBreak" ? <br key={key} /> : (node.marks ?? []).reduce<ReactNode>((inner, m) => mark(m, inner, key), node.text ?? "");

const isInline = (node: DocNode) => ["text", "hardBreak", "date", "pill"].includes(node.type);

/** An inline atom as the reader sees it: Cuboid's `Pill`, not interactive. A value the palette does not have falls back to the plain one. */
function atom(node: DocNode, key: number): ReactNode {
  // A date reads as text: the same as in the editor, where it also shows a ground when it can be pressed.
  if (node.type === "date") return <span key={key} data-date="">{formatDate(String(node.attrs?.iso ?? ""))}</span>;
  const { label, shade, intensity, bordered } = node.attrs ?? {};
  return (
    <Pill key={key} shade={isPillShade(shade) ? shade : "gray"} intensity={isPillIntensity(intensity) ? intensity : "light"} bordered={Boolean(bordered)}>
      {String(label ?? "")}
    </Pill>
  );
}

const GAP = "var(--cube-size-32px)";

/**
 * Draws a document, or any node of it, with the blocks it is given (the defaults when none are). Text, lists, quotes and columns are
 * built in; a node whose type is registered by nobody is shown as an unknown block, with its content, not dropped.
 */
export function Read({ node, blocks = readBlocks }: { node: DocNode; blocks?: ReadRegistry }): ReactNode {
  const kids = (node.content ?? []).map((child, i) => (isInline(child) ? (child.type === "date" || child.type === "pill" ? atom(child, i) : inline(child, i)) : <Read key={i} node={child} blocks={blocks} />));
  switch (node.type) {
    case "doc": return <Prose className={proseInline.Inline} data-component="Read">{kids}</Prose>;
    case "paragraph": return <p>{kids}</p>;
    case "blockquote": return <blockquote>{kids}</blockquote>;
    case "bulletList": return <ul>{kids}</ul>;
    case "orderedList": return <ol start={typeof node.attrs?.start === "number" ? node.attrs.start : undefined}>{kids}</ol>;
    case "listItem": return <li>{kids}</li>;
    // An outline's items are part of it, not blocks of their own: the title, then the outline hung from it.
    case "outlineItem": return <OutlineTree.Item>{kids}</OutlineTree.Item>;
    // A table's rows and cells are part of it, as an outline's items are: its block draws the frame, these draw what is in it.
    case "tableRow": return <Table.Row>{kids}</Table.Row>;
    case "tableHeader": return <Table.HeadCell colSpan={Number(node.attrs?.colspan) || undefined} rowSpan={Number(node.attrs?.rowspan) || undefined}>{kids}</Table.HeadCell>;
    case "tableCell": return <Table.Cell colSpan={Number(node.attrs?.colspan) || undefined} rowSpan={Number(node.attrs?.rowspan) || undefined}>{kids}</Table.Cell>;
    case "columns": return <div data-component="Columns" style={{ display: "flex", gap: GAP }}>{kids}</div>;
    case "column": return <div data-column="" data-prose-flow="" style={{ flex: `${Number(node.attrs?.flex) || 1} 1 0`, minWidth: 0 }}>{kids}</div>;
    case "heading": {
      const Heading = `h${node.attrs?.level ?? 1}` as "h1";
      return <Heading>{kids}</Heading>;
    }
    default: {
      const def = blocks[node.type];
      // A registered block is wrapped and marked, as the editor wraps it in its node view, so the stylesheet spaces it as it does there.
      if (!def) return <div data-block={node.type} data-unknown-block={node.type}>{kids}</div>;
      const defaults = Object.fromEntries(Object.entries(def.attrs).map(([name, spec]) => [name, spec.default]));
      return (
        <div data-block={node.type}>
          <def.Read attrs={{ ...defaults, ...node.attrs }} text={plainText(node)}>{kids}</def.Read>
        </div>
      );
    }
  }
}
