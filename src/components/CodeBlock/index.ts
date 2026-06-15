export { CodeSurface } from "./CodeSurface";
export type { CodeSurfaceProps, CodeSurfaceGutterIcons } from "./CodeSurface";

export { CodeBlock } from "./CodeBlock";
export type { CodeBlockProps } from "./CodeBlock";

export { JsonCodeView } from "./JsonCodeView";
export type { JsonCodeViewProps } from "./JsonCodeView";

export { highlightSource } from "./highlight";
export type { CodeBlockLanguage } from "./highlight";

export {
  buildLines,
  getAllCollapsiblePaths,
} from "./tokenizer";
export type { CodeLine, Token, TokenType } from "./tokenizer";

export type { SurfaceLine, SurfaceToken } from "./types";

export {
  CODE_SURFACE_ROW_HEIGHT_PX,
  CODE_SURFACE_VIRTUAL_THRESHOLD,
} from "./constants";

export {
  annotateBracketDepth,
  BRACKET_DEPTH_CYCLE,
  classifyJsonString,
  isLinkifiableTokenType,
  JSON_STRING_EMAIL_PATTERN,
  JSON_STRING_URL_PATTERN,
  jsonTokenColor,
  JSON_SYNTAX_TOKEN,
  linkHrefForSurfaceToken,
  syntaxCssVar,
  syntaxTokenClass,
  unquoteJsonStringLiteral,
} from "./syntax";
export type {
  JsonClassifiedStringType,
  JsonSyntaxKey,
  JsonSyntaxTokenType,
} from "./syntax";
