import { useMemo } from "react";
import type { CubeTheme } from "../../theme/types";
import { CodeSurface, type CodeSurfaceProps } from "./CodeSurface";
import { highlightSource, type CodeBlockLanguage } from "./highlight";
import { annotateBracketDepth } from "./syntax";

export interface CodeBlockProps
  extends Pick<
    CodeSurfaceProps,
    | "height"
    | "maxHeight"
    | "theme"
    | "linkify"
    | "onLinkClick"
    | "watchlist"
    | "defaultWatchlist"
    | "onWatchlistChange"
    | "surfaceVariant"
    | "aria-label"
  > {
  /** Source text to display. */
  code: string;
  /**
   * Highlighting grammar.
   * @default "text"
   */
  language?: CodeBlockLanguage;
}

/**
 * Generic source display — JavaScript, HTML, CSS, and plain text.
 * Tokenizes source into lines and renders via {@link CodeSurface}.
 *
 * For JSON API payloads use {@link JsonCodeView} instead.
 */
export function CodeBlock({
  code,
  language = "text",
  height,
  maxHeight,
  theme,
  linkify = false,
  onLinkClick,
  watchlist,
  defaultWatchlist,
  onWatchlistChange,
  surfaceVariant,
  "aria-label": ariaLabel,
}: CodeBlockProps) {
  const lines = useMemo(() => {
    const highlighted = highlightSource(code, language);
    return annotateBracketDepth(highlighted);
  }, [code, language]);

  return (
    <CodeSurface
      lines={lines}
      gutterLineCount={lines.length}
      height={height}
      maxHeight={maxHeight}
      theme={theme}
      linkify={linkify}
      onLinkClick={onLinkClick}
      watchlist={watchlist}
      defaultWatchlist={defaultWatchlist}
      onWatchlistChange={onWatchlistChange}
      surfaceVariant={surfaceVariant}
      aria-label={ariaLabel ?? `${language} code block`}
    />
  );
}
