import React, { useEffect, useMemo, useRef } from "react";
import { highlightSource, useTokens } from "../../../src";
import { resolveSyntaxColors } from "../../../src/components/CodeBlock/syntaxColors";
import type { SyntaxKey } from "../../../src/components/CodeBlock/syntaxColors";
import type { Highlight } from "./AnatomyContext";
import type { ExampleCode as Example } from "./exampleSource";
import classes from "./ExampleCode.module.css";

/** The code's token names, where they differ from the syntax colours' names. */
const COLOR_KEY: Record<string, SyntaxKey> = {
  boolean: "booleanLiteral",
  null: "nullLiteral",
  number: "numberLiteral",
};

/** The stretches of one line (`[from, to)` in columns) that the highlight covers; `to` is Infinity for "to the end of the line". */
function marksOnLine(
  highlight: Highlight | null,
  line: number,
): [number, number][] {
  const marks: [number, number][] = [];
  for (const { from, to } of highlight ?? []) {
    if (line < from.line || line > to.line) continue;
    marks.push([
      line === from.line ? from.column : 0,
      line === to.line ? to.column : Infinity,
    ]);
  }
  return marks;
}

/** Splits the line's tokens wherever a mark begins or ends, and says for each piece whether it is marked. */
function pieces(
  tokens: { type: string; value: string }[],
  marks: [number, number][],
) {
  const out: { type: string; text: string; marked: boolean }[] = [];
  let column = 0;
  for (const token of tokens) {
    const end = column + token.value.length;
    const cuts = [
      column,
      ...marks.flat().filter((c) => c > column && c < end),
      end,
    ].sort((a, b) => a - b);
    for (let i = 0; i < cuts.length - 1; i++) {
      const [a, b] = [cuts[i], cuts[i + 1]];
      if (b > a)
        out.push({
          type: token.type,
          text: token.value.slice(a - column, b - column),
          marked: marks.some(([from, to]) => a >= from && b <= to),
        });
    }
    column = end;
  }
  return out;
}

/**
 * The example's code: the imports it uses and the function as written, highlighted with Cuboid's own syntax colours, with exactly
 * the piece the hovered part was written as marked (its tags, or the whole element when it is on one line), not the whole line.
 * CodeBlock has no "mark this" (it has a watchlist, with controls), so this draws the lines itself from the same tokenizer.
 */
export function ExampleCode({
  example,
  marked,
}: {
  example: Example;
  marked: Highlight | null;
}) {
  const tokens = useTokens();
  const colors = useMemo(() => resolveSyntaxColors(tokens), [tokens]);
  const lines = useMemo(
    () => highlightSource(example.code, "tsx"),
    [example.code],
  );
  const first = useRef<HTMLDivElement>(null);
  // The displayed line (1-based) where the marked piece begins, if it is on screen.
  const firstShown = marked?.[0]
    ? example.lineMap.indexOf(marked[0].from.line) + 1
    : 0;

  // Keep the marked piece in view when the pointer moves over another part.
  useEffect(() => {
    first.current?.scrollIntoView({ block: "nearest" });
  }, [firstShown]);

  return (
    <div
      className={classes.Code}
      role="region"
      aria-label={`Example code: ${example.name}`}
      tabIndex={0}
    >
      {lines.map((line) => {
        // A line of the function is the file's line; a made line (an import, a blank) has none, so nothing is marked on it.
        const fileLine = example.lineMap[line.lineNumber - 1];
        const marks =
          fileLine === null || fileLine === undefined
            ? []
            : marksOnLine(marked, fileLine);
        return (
          <div
            key={line.lineNumber}
            className={classes.Line}
            data-marked={marks.length > 0 ? "" : undefined}
            ref={line.lineNumber === firstShown ? first : undefined}
          >
            <span className={classes.Number} aria-hidden="true">
              {line.lineNumber}
            </span>
            <span className={classes.Text}>
              {pieces(line.tokens, marks).map((piece, index) => {
                const color =
                  colors[COLOR_KEY[piece.type] ?? (piece.type as SyntaxKey)];
                return (
                  <span
                    key={index}
                    className={piece.marked ? classes.Mark : undefined}
                    style={color ? { color } : undefined}
                  >
                    {piece.text}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
