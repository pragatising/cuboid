import type { SyntaxColors } from "../../theme/types";
import styles from "./CodeSurface.module.css";
import type { SurfaceLine, SurfaceToken } from "./types";

// ── Token type → theme syntax key (globals.json color.syntax) ───────────────

export type JsonSyntaxKey = keyof SyntaxColors | "foregroundMuted";

export const JSON_SYNTAX_TOKEN = {
  key: "key",
  string: "string",
  string_url: "stringUrl",
  string_email: "stringEmail",
  string_uuid: "stringUuid",
  number: "numberLiteral",
  boolean: "booleanLiteral",
  null: "nullLiteral",
  bracket: "bracket",
  operator: "foregroundMuted",
  punctuation: "foregroundMuted",
  ellipsis: "foregroundMuted",
} as const satisfies Record<string, JsonSyntaxKey>;

export type JsonSyntaxTokenType = keyof typeof JSON_SYNTAX_TOKEN;

export function syntaxCssVar(
  key: Exclude<JsonSyntaxKey, "foregroundMuted">,
): string {
  const seg = key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
  return `--cube-color-syntax-${seg}`;
}

/** Inline colour fallback when `tokenColor` prop is used (default path uses CSS classes). */
export function jsonTokenColor(
  type: string,
  syntax: SyntaxColors,
  mutedForeground: string,
): string {
  const key = JSON_SYNTAX_TOKEN[type as JsonSyntaxTokenType];
  if (key === "foregroundMuted") return mutedForeground;
  if (key) return syntax[key];
  return mutedForeground;
}

// ── Nested bracket depth (alternating delimiter colours) ────────────────────

const BRACKET_OPEN = new Set(["{", "[", "(", "<"]);
const BRACKET_CLOSE = new Set(["}", "]", ")", ">"]);

/** Cycle length for alternating bracket colours (maps to `.tokenBracketDepthN` in CSS). */
export const BRACKET_DEPTH_CYCLE = 2;

function pushBracketToken(
  out: SurfaceToken[],
  token: SurfaceToken,
  ch: string,
  depth: number,
): void {
  out.push({
    ...token,
    type: "bracket",
    value: ch,
    bracketDepth: depth % BRACKET_DEPTH_CYCLE,
  });
}

/**
 * Assign `bracketDepth` on each delimiter. Run on the full line list before
 * virtual scroll slicing so depth stays correct across the file.
 */
export function annotateBracketDepth(lines: SurfaceLine[]): SurfaceLine[] {
  let depth = 0;
  const result: SurfaceLine[] = [];

  for (const line of lines) {
    const tokens: SurfaceToken[] = [];

    for (const token of line.tokens) {
      if (token.type !== "bracket") {
        tokens.push(token);
        continue;
      }

      for (const ch of token.value) {
        if (BRACKET_OPEN.has(ch)) {
          pushBracketToken(tokens, token, ch, depth);
          depth++;
        } else if (BRACKET_CLOSE.has(ch)) {
          depth = Math.max(0, depth - 1);
          pushBracketToken(tokens, token, ch, depth);
        } else {
          tokens.push({ ...token, type: "bracket", value: ch });
        }
      }
    }

    result.push({ ...line, tokens });
  }

  return result;
}

// ── Token type → CSS module class ───────────────────────────────────────────

const TOKEN_CLASS: Record<string, string> = {
  key: styles.tokenKey,
  string: styles.tokenString,
  string_url: styles.tokenStringUrl,
  string_email: styles.tokenStringEmail,
  string_uuid: styles.tokenStringUuid,
  number: styles.tokenNumber,
  boolean: styles.tokenBoolean,
  null: styles.tokenNull,
  bracket: styles.tokenBracket,
  operator: styles.tokenOperator,
  punctuation: styles.tokenMuted,
  ellipsis: styles.tokenMuted,
  plain: styles.tokenPlain,
  comment: styles.tokenComment,
  keyword: styles.tokenKeyword,
  constant: styles.tokenConstant,
  entity: styles.tokenEntity,
  entityTag: styles.tokenEntityTag,
  variable: styles.tokenVariable,
  stringRegexp: styles.tokenStringRegexp,
};

const BRACKET_DEPTH_CLASS = [
  styles.tokenBracketDepth0,
  styles.tokenBracketDepth1,
] as const;

export function syntaxTokenClass(token: SurfaceToken | string): string {
  const type = typeof token === "string" ? token : token.type;

  if (
    type === "bracket" &&
    typeof token !== "string" &&
    token.bracketDepth != null
  ) {
    const idx = token.bracketDepth % BRACKET_DEPTH_CYCLE;
    return BRACKET_DEPTH_CLASS[idx] ?? styles.tokenBracket;
  }

  return TOKEN_CLASS[type] ?? styles.tokenMuted;
}

// ── JSON string link detection (shared with tokenizer) ───────────

/** Classified JSON string value token types. */
export type JsonClassifiedStringType =
  | "string"
  | "string_url"
  | "string_email"
  | "string_uuid";

export const JSON_STRING_URL_PATTERN = /^https?:\/\/[^\s"]+$/i;
export const JSON_STRING_EMAIL_PATTERN = /^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/;

const JSON_STRING_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function classifyJsonString(raw: string): JsonClassifiedStringType {
  if (JSON_STRING_URL_PATTERN.test(raw)) return "string_url";
  if (JSON_STRING_EMAIL_PATTERN.test(raw)) return "string_email";
  if (JSON_STRING_UUID_PATTERN.test(raw)) return "string_uuid";
  return "string";
}

export function unquoteJsonStringLiteral(display: string): string {
  if (display.length >= 2 && display.startsWith('"') && display.endsWith('"')) {
    try {
      return JSON.parse(display) as string;
    } catch {
      return display
        .slice(1, -1)
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }
  }
  return display;
}

export function isLinkifiableTokenType(type: string): boolean {
  return type === "string_url" || type === "string_email";
}

export function linkHrefForSurfaceToken(
  token: Pick<SurfaceToken, "type" | "value">,
): string | undefined {
  const raw = unquoteJsonStringLiteral(token.value);
  if (!raw) return undefined;

  if (token.type === "string_url" && JSON_STRING_URL_PATTERN.test(raw)) {
    return raw;
  }

  if (token.type === "string_email" && JSON_STRING_EMAIL_PATTERN.test(raw)) {
    return `mailto:${raw}`;
  }

  return undefined;
}
