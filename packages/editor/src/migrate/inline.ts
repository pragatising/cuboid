import type { DocNode, Mark } from "../core";
import { safeHref } from "../utils/link";
import { mapHighlight, mapTextColor, parsePillToken } from "./colors";

/**
 * Reads the old editor's inline syntax into document nodes:
 *   `**bold**  *italic*  ++underline++  `code`  [text](url)  {c:token}…{/c}  {bg:token}…{/bg}  {pill:token}label{/pill}  {date:YYYY-MM-DD}{/date}  {{chip}}`
 * A marker with no closing partner is plain text, as it was in the old editor. Code keeps no other mark (code excludes them), a link is kept
 * only if its address is safe, the pill and date become inline atoms, and a chip is a mark.
 */
export function parseInline(source: string, base: Mark[] = []): DocNode[] {
  return run(source, base);
}

const withMark = (marks: Mark[], mark: Mark) => [...marks.filter((m) => m.type !== mark.type), mark];

const text = (value: string, marks: Mark[]): DocNode => (marks.length ? { type: "text", text: value, marks } : { type: "text", text: value });

/** The plain text of some nodes, for a pill's label. */
const plain = (nodes: DocNode[]): string => nodes.map((n) => (n.type === "hardBreak" ? " " : (n.text ?? ""))).join("").trim();

const BRACE = [
  { re: /\{c:([a-z0-9.]+)\}/y, close: "{/c}" },
  { re: /\{bg:([a-z0-9.]+)\}/y, close: "{/bg}" },
  { re: /\{pill:([a-z]+-[a-z]+-[fb])\}/y, close: "{/pill}" },
  { re: /\{date:(\d{4}-\d{2}-\d{2})\}/y, close: "{/date}" },
] as const;

const LINK = /\[([^\]]+)\]\(([^)]*)\)/y;

function run(source: string, marks: Mark[]): DocNode[] {
  const out: DocNode[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer) out.push(text(buffer, marks));
    buffer = "";
  };
  /** Where a closing marker is, leaving at least one character of content (the old patterns were lazy and non-empty). */
  const closing = (from: number, marker: string, minimum = 1) => source.indexOf(marker, from + minimum);

  for (let i = 0; i < source.length; ) {
    const ch = source[i];

    if (ch === "[") {
      LINK.lastIndex = i;
      const link = LINK.exec(source);
      const href = link ? safeHref(link[2]) : null;
      if (link && href) {
        flush();
        out.push(...run(link[1], withMark(marks, { type: "link", attrs: { href } })));
        i += link[0].length;
        continue;
      }
    }

    if (ch === "{") {
      if (source.startsWith("{{", i)) {
        const end = closing(i + 2, "}}");
        if (end !== -1) {
          flush();
          out.push(...run(source.slice(i + 2, end), withMark(marks, { type: "chip" })));
          i = end + 2;
          continue;
        }
      }
      const found = BRACE.map((b) => ({ b, match: ((b.re.lastIndex = i), b.re.exec(source)) })).find((x) => x.match);
      if (found?.match) {
        const { b, match } = found;
        const open = match[0].length;
        const end = closing(i + open, b.close, b.close === "{/date}" ? 0 : 1);
        if (end !== -1) {
          const inner = source.slice(i + open, end);
          const next = end + b.close.length;
          if (b.close === "{/c}" || b.close === "{/bg}") {
            const color = b.close === "{/c}" ? mapTextColor(match[1]) : mapHighlight(match[1]);
            flush();
            const mark: Mark | null = b.close === "{/c}" ? (color ? { type: "textColor", attrs: { color } } : null) : { type: "highlight", attrs: { color } };
            out.push(...run(inner, mark ? withMark(marks, mark) : marks));
            i = next;
            continue;
          }
          if (b.close === "{/pill}") {
            const pill = parsePillToken(match[1]);
            if (pill) {
              flush();
              out.push({ type: "pill", attrs: { label: plain(run(inner, [])), ...pill } });
              i = next;
              continue;
            }
          }
          if (b.close === "{/date}") {
            flush();
            out.push({ type: "date", attrs: { iso: match[1] } });
            i = next;
            continue;
          }
        }
      }
    }

    if (ch === "`") {
      const end = closing(i + 1, "`");
      if (end !== -1) {
        flush();
        out.push(text(source.slice(i + 1, end), [{ type: "code" }]));
        i = end + 1;
        continue;
      }
    }

    const delimited = [
      ["**", { type: "bold" }],
      ["++", { type: "underline" }],
      ["*", { type: "italic" }],
    ] as const;
    const pair = delimited.find(([marker]) => source.startsWith(marker, i) && closing(i + marker.length, marker) !== -1);
    if (pair) {
      const [marker, mark] = pair;
      const end = closing(i + marker.length, marker);
      flush();
      out.push(...run(source.slice(i + marker.length, end), withMark(marks, mark)));
      i = end + marker.length;
      continue;
    }

    if (ch === "\n") {
      flush();
      out.push({ type: "hardBreak" });
      i += 1;
      continue;
    }

    buffer += ch;
    i += 1;
  }
  flush();
  return out;
}
