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
  | "cssValue"
  | "componentTag"
  | "tagBracket"
  | "jsxText"
  | "jsxAttribute"
  // The TypeScript and React vocabulary: what a language with more kinds of name than JSON needs said apart.
  | "docComment"
  | "docTag"
  | "storage"
  | "functionDeclaration"
  | "parameter"
  | "constant"
  | "stringEscape"
  | "templateInterpolation"
  | "operator"
  | "punctuation"
  | "bracketLevel1"
  | "bracketLevel2"
  | "bracketLevel3"
  | "htmlTag";

/** Which language's colours the kinds that every language has (a string, a number, a boolean) take. */
export type SyntaxLanguage = "json" | "typescript";

export type SyntaxColors = Record<SyntaxKey, string>;

/**
 * One colour per `SyntaxKey`: the code-only kinds (string URL / email / UUID, keywords, tags) from the TypeScript, HTML and CSS
 * groups, and the kinds every language has (a string, a number, a boolean, a bracket) from the language asked for: JSON's own for
 * JSON, which is what a viewer of data draws, and TypeScript's for code, which has its own readable set.
 */
export function resolveSyntaxColors({ syntax }: Pick<Tokens, "syntax">, language: SyntaxLanguage = "json"): SyntaxColors {
  const { json, typescript: ts, html, css } = syntax;
  const own = language === "typescript" ? ts : json;
  return {
    key: json.key,
    string: own.string,
    stringUrl: ts.stringUrl,
    stringEmail: ts.stringEmail,
    stringUuid: ts.stringUuid,
    numberLiteral: own.numberLiteral,
    booleanLiteral: own.booleanLiteral,
    nullLiteral: own.nullLiteral,
    bracket: language === "typescript" ? ts.bracketLevel1 : json.bracket,
    bracketNested: language === "typescript" ? ts.bracketLevel2 : json.bracketNested,
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
    componentTag: ts.componentTag,
    tagBracket: ts.tagBracket,
    jsxText: ts.jsxText,
    jsxAttribute: ts.jsxAttribute,
    docComment: ts.docComment,
    docTag: ts.docTag,
    storage: ts.storage,
    functionDeclaration: ts.functionDeclaration,
    parameter: ts.parameter,
    constant: ts.constant,
    stringEscape: ts.stringEscape,
    templateInterpolation: ts.templateInterpolation,
    operator: ts.operator,
    punctuation: ts.punctuation,
    bracketLevel1: ts.bracketLevel1,
    bracketLevel2: ts.bracketLevel2,
    bracketLevel3: ts.bracketLevel3,
    htmlTag: ts.htmlTag,
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
