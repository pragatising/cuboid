import type { SurfaceLine, SurfaceToken } from "../types";

export interface HighlightState {
  /** True while inside an unclosed block comment (JS/CSS). */
  inBlockComment: boolean;
}

export interface SourceRule {
  type: string;
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
      rule.onMatch?.(state, value);
      tokens.push({ type: rule.type, value });
      rest = rest.slice(value.length);
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
): SurfaceLine[] {
  const rawLines = code.split("\n");
  const state: HighlightState = { inBlockComment: false };

  return rawLines.map((line, index) => ({
    lineNumber: index + 1,
    depth: 0,
    tokens: highlightLine(line, state),
  }));
}
