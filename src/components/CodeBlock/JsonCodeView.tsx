import React, { useMemo, useState } from "react";
import type { CubeTheme } from "../../theme/types";
import { CodeSurface, type CodeSurfaceGutterIcons, type CodeSurfaceProps } from "./CodeSurface";
import { buildLines, getAllCollapsiblePaths } from "./tokenizer";
import type { SurfaceLine } from "./types";

export interface JsonCodeViewProps
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
    | "indent"
    | "aria-label"
    | "surfaceVariant"
  > {
  /** Any JSON-serialisable value to render as syntax-coloured code lines. */
  data: unknown;
  /**
   * Start with all collapsible nodes collapsed.
   * @default false
   */
  defaultCollapsed?: boolean;
  /** Custom chevron icons for collapse toggles in the gutter. */
  gutterIcons?: CodeSurfaceGutterIcons;
}

/**
 * JSON → tokenized lines → {@link CodeSurface}.
 * Use for API response bodies, debug panels, and large structured payloads.
 */
export function JsonCodeView({
  data,
  defaultCollapsed = false,
  gutterIcons,
  height,
  maxHeight,
  theme,
  linkify,
  onLinkClick,
  watchlist,
  defaultWatchlist,
  onWatchlistChange,
  indent,
  surfaceVariant,
  "aria-label": ariaLabel,
}: JsonCodeViewProps) {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() =>
    defaultCollapsed ? getAllCollapsiblePaths(data) : new Set(),
  );

  function togglePath(path: string) {
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  const expandedLineCount = useMemo(
    () => buildLines(data, new Set()).length,
    [data],
  );

  const lines = useMemo(
    () => buildLines(data, collapsedPaths) as SurfaceLine[],
    [data, collapsedPaths],
  );

  return (
    <CodeSurface
      lines={lines}
      gutterLineCount={expandedLineCount}
      onToggleCollapse={togglePath}
      gutterIcons={gutterIcons}
      height={height}
      maxHeight={maxHeight}
      theme={theme}
      linkify={linkify}
      onLinkClick={onLinkClick}
      watchlist={watchlist}
      defaultWatchlist={defaultWatchlist}
      onWatchlistChange={onWatchlistChange}
      indent={indent}
      surfaceVariant={surfaceVariant}
      aria-label={ariaLabel ?? "JSON code view"}
    />
  );
}
