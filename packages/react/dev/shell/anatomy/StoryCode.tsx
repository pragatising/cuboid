import React, { useEffect, useMemo, useRef } from "react";
import { highlightSource, useTokens } from "../../../src";
import { resolveSyntaxColors } from "../../../src/components/CodeBlock/syntaxColors";
import type { SyntaxKey } from "../../../src/components/CodeBlock/syntaxColors";
import type { LineRange, StoryCode as Story } from "./AnatomyContext";
import classes from "./StoryCode.module.css";

/** The story's token names, where they differ from the syntax colours' names. */
const COLOR_KEY: Record<string, SyntaxKey> = {
  boolean: "booleanLiteral",
  null: "nullLiteral",
  number: "numberLiteral",
};

/**
 * The story's code, highlighted with Cuboid's own syntax colours, with the lines of the hovered part marked. CodeBlock has no
 * "mark these lines" (it has a watchlist, with controls), so this draws the lines itself from the same tokenizer.
 */
export function StoryCode({
  story,
  marked,
}: {
  story: Story;
  marked: LineRange | null;
}) {
  const tokens = useTokens();
  const colors = useMemo(() => resolveSyntaxColors(tokens), [tokens]);
  const lines = useMemo(() => highlightSource(story.code, "tsx"), [story.code]);
  const first = useRef<HTMLDivElement>(null);

  // Keep the marked lines in view when the pointer moves over another part.
  useEffect(() => {
    first.current?.scrollIntoView({ block: "nearest" });
  }, [marked?.from, marked?.to]);

  return (
    <div
      className={classes.Code}
      role="region"
      aria-label={`Story code: ${story.name}`}
      tabIndex={0}
    >
      {lines.map((line) => {
        const number = story.firstLine + line.lineNumber - 1;
        const isMarked =
          marked !== null && number >= marked.from && number <= marked.to;
        return (
          <div
            key={number}
            className={classes.Line}
            data-marked={isMarked ? "" : undefined}
            ref={isMarked && number === marked.from ? first : undefined}
          >
            <span className={classes.Number} aria-hidden="true">
              {number}
            </span>
            <span className={classes.Text}>
              {line.tokens.map((token, index) => {
                const color =
                  colors[COLOR_KEY[token.type] ?? (token.type as SyntaxKey)];
                return (
                  <span key={index} style={color ? { color } : undefined}>
                    {token.value}
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
