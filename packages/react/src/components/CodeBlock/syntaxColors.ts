import type React from "react";
import type { Tokens } from "../../mode";
import { cssVars } from "../../utils/cssVars";

/** The syntax colours CodeSurface paints with, flattened from the per-language `syntax` token groups. */
export type SyntaxKey =
  | "key"
  | "string"
  | "stringUrl"
  | "stringEmail"
  | "stringUuid"
  | "numberLiteral"
  | "booleanLiteral"
  | "nullLiteral"
  | "bracket"
  | "bracketNested"
  | "comment"
  | "keyword"
  | "entityTag"
  | "stringRegexp"
  | "functionCall"
  | "typeName"
  | "propertyAccess"
  | "attributeName"
  | "cssSelector"
  | "cssProperty"
  | "cssValue";

export type SyntaxColors = Record<SyntaxKey, string>;

/**
 * One colour per `SyntaxKey`: JSON's own for the JSON value kinds, and the shared kinds (string URL / email / UUID,
 * the code-only kinds) from the TypeScript, HTML and CSS groups, since JSON has no tokens of its own for them.
 */
export function resolveSyntaxColors({ syntax }: Pick<Tokens, "syntax">): SyntaxColors {
  const { json, typescript: ts, html, css } = syntax;
  return {
    key: json.key,
    string: json.string,
    stringUrl: ts.stringUrl,
    stringEmail: ts.stringEmail,
    stringUuid: ts.stringUuid,
    numberLiteral: json.numberLiteral,
    booleanLiteral: json.booleanLiteral,
    nullLiteral: json.nullLiteral,
    bracket: json.bracket,
    bracketNested: json.bracketNested,
    comment: ts.comment,
    keyword: ts.keyword,
    entityTag: html.entityTag,
    stringRegexp: ts.stringRegexp,
    functionCall: ts.functionCall,
    typeName: ts.typeName,
    propertyAccess: ts.propertyAccess,
    attributeName: html.attributeName,
    cssSelector: css.cssSelector,
    cssProperty: css.cssProperty,
    cssValue: css.cssValue,
  };
}

/**
 * Element-scoped variables the CodeSurface CSS reads (`--code-surface-syntax-<key>`, row backgrounds, surface colours,
 * the few spacings). The values come from `useTokens()`, so a mode change re-renders them.
 */
export function codeSurfaceVars(tokens: Tokens): React.CSSProperties {
  const { codeBlock, bgColor, fgColor, borderColor, borderWidth, space, size } = tokens;
  return cssVars("codeSurface", {
    syntax: resolveSyntaxColors(tokens),
    rowHoverBg: codeBlock.rowHoverBg,
    collapsedRowBg: codeBlock.collapsedRowBg,
    watchMark: codeBlock.watchMark,
    watchMarkHover: codeBlock.watchMarkHover,
    watchRowBg: codeBlock.watchRowBg,
    bg: bgColor.canvas.subtle,
    plain: fgColor.neutral.default,
    muted: fgColor.neutral.muted,
    gutterBorder: borderColor.translucent["2"],
    borderWidth: borderWidth.thin,
    pad12: space.sm,
    pad10: size["10"],
    pad8: space.xs,
    pad6: size["6"],
  });
}
