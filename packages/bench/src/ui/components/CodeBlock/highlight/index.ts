import type { SurfaceLine } from "../types";
import { highlightCss } from "./css";
import { highlightHtml } from "./html";
import {
  highlightJavaScript,
  highlightJsx,
  highlightTsx,
  highlightTypeScript,
} from "./javascript";
import { linesFromSource } from "./shared";

/** Languages supported by {@link highlightSource}. */
export type CodeBlockLanguage =
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "html"
  | "css"
  | "text";

function highlightPlain(code: string): SurfaceLine[] {
  return linesFromSource(code, (line) => [{ type: "plain", value: line || " " }]);
}

const HIGHLIGHTERS: Record<
  CodeBlockLanguage,
  (code: string) => SurfaceLine[]
> = {
  javascript: highlightJavaScript,
  typescript: highlightTypeScript,
  jsx: highlightJsx,
  tsx: highlightTsx,
  html: highlightHtml,
  css: highlightCss,
  text: highlightPlain,
};

/** Tokenize source text into {@link SurfaceLine}s for {@link CodeSurface}. */
export function highlightSource(
  code: string,
  language: CodeBlockLanguage = "text",
): SurfaceLine[] {
  const highlight = HIGHLIGHTERS[language] ?? highlightPlain;
  return highlight(code);
}
