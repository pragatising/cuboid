import React from "react";
import classes from "./PropSelectors.module.css";

/** A piece of a type as written, and what it is, for its colour. */
export type TypePart = { text: string; kind: "string" | "number" | "name" | "keyword" | "punctuation" | "space" };

const PIECES = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\d+(?:\.\d+)?|[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*|=>|\s+|[^\sA-Za-z0-9_$"'])/g;
const KEYWORDS = new Set(["void", "string", "number", "boolean", "null", "undefined", "unknown", "never", "any", "true", "false", "typeof", "keyof"]);

/** A type as the pieces it is written in: literals, names, keywords and punctuation, so each can be coloured as the code view colours them. */
export function typeParts(type: string): TypePart[] {
  return [...type.matchAll(PIECES)].map(([text]) => ({
    text,
    kind: /^["']/.test(text) ? "string" : /^\d/.test(text) ? "number" : /^\s+$/.test(text) ? "space" : /^[A-Za-z_$]/.test(text) ? (KEYWORDS.has(text) ? "keyword" : "name") : "punctuation",
  }));
}

/**
 * What a prop's type is, as the Figma shows a read-only prop: the type as written, in the colours of code (text in orange, names and the words of the language in teal). Nothing can be changed here: it is how a prop is read when no example is being played with.
 */
export function TypeSignature({ type, title }: { type: string; title?: string }) {
  return (
    <span className={classes.Signature} title={title}>
      {typeParts(type).map((part, index) => (
        <span key={index} data-kind={part.kind}>
          {part.text}
        </span>
      ))}
    </span>
  );
}
