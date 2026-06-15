import { linesFromSource, tokenizeLine, type HighlightState, type SourceRule } from "./shared";

const RULES: SourceRule[] = [
  {
    type: "comment",
    pattern: /^<!--[\s\S]*?-->/,
  },
  {
    type: "comment",
    pattern: /^<!--[\s\S]*/,
  },
  {
    type: "bracket",
    pattern: /^<\/?/,
  },
  {
    type: "entityTag",
    pattern: /^[A-Za-z][\w:-]*/,
  },
  {
    type: "bracket",
    pattern: /^\/\/>/,
  },
  {
    type: "bracket",
    pattern: /^>/,
  },
  {
    type: "string",
    pattern: /^"(?:\\.|[^"\\])*"/,
  },
  {
    type: "string",
    pattern: /^'(?:\\.|[^'\\])*'/,
  },
  {
    type: "key",
    pattern: /^[A-Za-z_:][\w:.-]*/,
  },
  {
    type: "operator",
    pattern: /^=/,
  },
  {
    type: "bracket",
    pattern: /^[{}[\]()]/,
  },
];

function highlightHtmlLine(line: string, state: HighlightState) {
  return tokenizeLine(line, RULES, state);
}

export function highlightHtml(code: string) {
  return linesFromSource(code, highlightHtmlLine);
}
