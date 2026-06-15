import type { SurfaceToken } from "../types";
import {
  linesFromSource,
  type HighlightState,
  type SourceRule,
  tokenizeLine,
} from "./shared";

const JS_KEYWORDS =
  "\\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|throw|try|typeof|var|void|while|with|yield)\\b";

const TS_KEYWORDS =
  "\\b(?:abstract|as|declare|implements|interface|keyof|namespace|never|private|protected|public|readonly|satisfies|type|undefined)\\b";

const LITERALS = "\\b(?:true|false|null)\\b";

const BASE_RULES: SourceRule[] = [
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
    type: "comment",
    pattern: /^\/\/[^\n]*/,
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
    type: "string",
    pattern: /^`(?:\\.|[^`\\])*`/,
  },
  {
    type: "keyword",
    pattern: new RegExp(JS_KEYWORDS),
  },
  {
    type: "boolean",
    pattern: new RegExp(LITERALS),
  },
  {
    type: "number",
    pattern: /^-?(?:0x[\da-fA-F]+|\d+\.\d+|\d+)(?:[eE][+-]?\d+)?\b/,
  },
  {
    type: "bracket",
    pattern: /^[{}[\]().,;:<>]/,
  },
  {
    type: "constant",
    pattern: /^#[A-Za-z][\w-]*/,
  },
  {
    type: "variable",
    pattern: /^[$A-Z_a-z][\w$]*/,
  },
  {
    type: "operator",
    pattern: /^[=+\-*/%!&|^~?]+/,
  },
];

const TS_ONLY_RULES: SourceRule[] = [
  {
    type: "keyword",
    pattern: new RegExp(TS_KEYWORDS),
  },
];

function highlightJsLine(line: string, state: HighlightState, ts: boolean): SurfaceToken[] {
  const rules = ts ? [...BASE_RULES, ...TS_ONLY_RULES] : BASE_RULES;
  return tokenizeLine(line, rules, state);
}

export function highlightJavaScript(code: string) {
  return linesFromSource(code, (line, state) => highlightJsLine(line, state, false));
}

export function highlightTypeScript(code: string) {
  return linesFromSource(code, (line, state) => highlightJsLine(line, state, true));
}

/** JSX/TSX v1 — same rules as JS/TS; tag highlighting comes in a later pass. */
export const highlightJsx = highlightJavaScript;
export const highlightTsx = highlightTypeScript;
