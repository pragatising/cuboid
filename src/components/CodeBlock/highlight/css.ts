import { linesFromSource, tokenizeLine, type HighlightState, type SourceRule } from "./shared";

const RULES: SourceRule[] = [
  {
    type: "comment",
    pattern: /^\/\*[\s\S]*?\*\//,
  },
  {
    type: "comment",
    pattern: /^\/\*/,
    onMatch(state) {
      state.inBlockComment = true;
    },
  },
  {
    type: "keyword",
    pattern: /^@(?:media|keyframes|import|charset|font-face|layer|supports|scope)\b/,
  },
  {
    type: "keyword",
    pattern: /^!important\b/,
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
    type: "cssSelector",
    pattern: /^#[\w-]+/,
  },
  {
    type: "cssSelector",
    pattern: /^\.[\w-]+/,
  },
  {
    type: "cssSelector",
    pattern: /^::?[\w-]+(?:\([\w-]+\))?/,
  },
  {
    type: "number",
    pattern: /^-?(?:\d+\.\d+|\d+)(?:%|[a-z]{2,4})?\b/i,
  },
  {
    type: "cssProperty",
    pattern: /^[\w-]+(?=\s*:)/,
  },
  {
    type: "bracket",
    pattern: /^[{}[\]();]/,
  },
  {
    type: "operator",
    pattern: /^[:>,+~]/,
  },
  {
    type: "cssValue",
    pattern: /^[$A-Z_a-z][\w-]*/,
  },
];

function highlightCssLine(line: string, state: HighlightState) {
  return tokenizeLine(line, RULES, state);
}

export function highlightCss(code: string) {
  return linesFromSource(code, highlightCssLine);
}
