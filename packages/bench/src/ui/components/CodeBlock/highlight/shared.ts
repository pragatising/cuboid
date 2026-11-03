import type { SurfaceLine, SurfaceToken } from "../types";

export interface HighlightState {
  /** True while inside an unclosed block comment (JS/CSS). */
  inBlockComment: boolean;
  /**
   * Free-form per-language state bag. JS/TS/JSX use this to track positional
   * context (e.g. "next identifier is a type name") across a single line —
   * see `JsHighlightState` in javascript.ts. Kept generic here so `shared.ts`
   * stays language-agnostic; each highlighter owns the shape it stores.
   */
  lang?: Record<string, unknown>;
}

/**
 * Context passed to a dynamic `SourceRule.type` resolver. Gives the resolver
 * lookbehind (via `tokensSoFar`, the tokens already pushed for this line) and
 * lookahead (via `rest`, the remaining unconsumed source) — enough for
 * near-100%-reliable rules like `functionCall`/`propertyAccess` without a
 * parser.
 */
export interface RuleMatchContext {
  value: string;
  state: HighlightState;
  /** Remaining line content AFTER this match is consumed. */
  rest: string;
  /** Tokens already emitted for the current line, in order. */
  tokensSoFar: readonly SurfaceToken[];
}

export interface SourceRule {
  /** Static type, or a resolver for context-dependent classification (lookahead/lookbehind/state). */
  type: string | ((ctx: RuleMatchContext) => string);
  /** Must match from the start of the remaining slice (`^`). */
  pattern: RegExp;
  /** When matched, update highlight state before continuing. */
  onMatch?: (state: HighlightState, value: string) => void;
}

export function coalesceAdjacent(tokens: SurfaceToken[], type: string): SurfaceToken[] {
  const out: SurfaceToken[] = [];
  for (const token of tokens) {
    const prev = out[out.length - 1];
    if (prev?.type === type && token.type === type) {
      prev.value += token.value;
    } else {
      out.push({ ...token });
    }
  }
  return out;
}

export function tokenizeLine(
  line: string,
  rules: SourceRule[],
  state: HighlightState,
): SurfaceToken[] {
  const tokens: SurfaceToken[] = [];
  let rest = line;

  if (state.inBlockComment) {
    const end = rest.indexOf("*/");
    if (end === -1) {
      tokens.push({ type: "comment", value: rest });
      return tokens;
    }
    tokens.push({ type: "comment", value: rest.slice(0, end + 2) });
    rest = rest.slice(end + 2);
    state.inBlockComment = false;
  }

  while (rest.length > 0) {
    let matched = false;

    for (const rule of rules) {
      const m = rule.pattern.exec(rest);
      if (!m || m.index !== 0) continue;

      const value = m[0];
      const consumedRest = rest.slice(value.length);
      rule.onMatch?.(state, value);
      const type =
        typeof rule.type === "function"
          ? rule.type({ value, state, rest: consumedRest, tokensSoFar: tokens })
          : rule.type;
      tokens.push({ type, value });
      rest = consumedRest;
      matched = true;
      break;
    }

    if (!matched) {
      tokens.push({ type: "plain", value: rest[0]! });
      rest = rest.slice(1);
    }
  }

  return coalesceAdjacent(tokens, "plain");
}

export function linesFromSource(
  code: string,
  highlightLine: (line: string, state: HighlightState) => SurfaceToken[],
  initialLangState?: () => Record<string, unknown>,
): SurfaceLine[] {
  const rawLines = code.split("\n");
  const state: HighlightState = {
    inBlockComment: false,
    lang: initialLangState?.(),
  };

  return rawLines.map((line, index) => ({
    lineNumber: index + 1,
    depth: 0,
    tokens: highlightLine(line, state),
  }));
}
