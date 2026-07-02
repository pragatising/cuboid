import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box } from "../core/Box";
import { Icon } from "../core/Icon/Icon";
import { Stack } from "../core/Stack";
import { Tooltip } from "../core/Tooltip/Tooltip";
import { ChevronRightIcon, ExpandMoreIcon } from "../../icons/material";
import { useTheme } from "../../theme/ThemeContext";
import { codeBlockTypographyCubeOverride, syntaxColorsCubeOverride } from "../../theme/themeCubeOverride";
import type { CubeTheme } from "../../theme/types";
import {
  CODE_SURFACE_OVERSCAN,
  CODE_SURFACE_ROW_HEIGHT_PX,
  CODE_SURFACE_SCROLL_CLASS,
  CODE_SURFACE_SCROLL_CSS,
  CODE_SURFACE_SCROLL_STYLE_ID,
  CODE_SURFACE_VIRTUAL_THRESHOLD,
} from "./constants";
import {
  annotateBracketDepth,
  linkHrefForSurfaceToken,
  syntaxTokenClass,
} from "./syntax";
import styles from "./CodeSurface.module.css";
import type { SurfaceLine, SurfaceToken } from "./types";

export interface CodeSurfaceGutterIcons {
  collapsed?: React.ReactNode;
  expanded?: React.ReactNode;
}

export interface CodeSurfaceProps {
  /** Visible lines to render (may be a window when virtualised). */
  lines: SurfaceLine[];
  /**
   * Total line count used to size the line-number gutter.
   * Often the fully-expanded count, which can differ from `lines.length`
   * when nodes are collapsed.
   */
  gutterLineCount: number;
  /**
   * Optional per-token colour override. When omitted, syntax colours come from
   * theme CSS variables via {@link CodeSurface.module.css}.
   */
  tokenColor?: (type: string) => string;
  onToggleCollapse?: (collapseKey: string) => void;
  gutterIcons?: CodeSurfaceGutterIcons;
  indent?: string;
  height?: string;
  maxHeight?: string;
  /** Render detected URLs and emails as clickable links. @default true */
  linkify?: boolean;
  onLinkClick?: (
    href: string,
    token: SurfaceToken,
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => void;
  /**
   * 1-indexed line numbers on the watchlist (controlled).
   * Pass with `onWatchlistChange` or use `defaultWatchlist` for uncontrolled mode.
   */
  watchlist?: ReadonlySet<number> | readonly number[];
  /** Initial watchlist when uncontrolled. */
  defaultWatchlist?: readonly number[];
  /** Called when the user toggles a watchlist marker in the gutter. Enables watchlist UI. */
  onWatchlistChange?: (watchlist: Set<number>) => void;
  theme?: CubeTheme;
  /**
   * `embedded` omits border and radius — use when nesting inside a parent shell
   * (e.g. {@link ApiResponseViewer}).
   * @default "default"
   */
  surfaceVariant?: "default" | "embedded";
  "aria-label"?: string;
}

function renderSurfaceToken(
  token: SurfaceToken,
  options: {
    linkify: boolean;
    tokenColor?: (type: string) => string;
    onLinkClick?: CodeSurfaceProps["onLinkClick"];
  },
): React.ReactNode {
  const className = `${styles.token} ${syntaxTokenClass(token)}`;
  const inlineStyle = options.tokenColor
    ? { color: options.tokenColor(token.type) }
    : undefined;
  const href = options.linkify ? linkHrefForSurfaceToken(token) : undefined;

  if (href) {
    const external = /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        className={`${className} ${styles.tokenLink}`}
        style={inlineStyle}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={
          options.onLinkClick
            ? (event) => options.onLinkClick!(href, token, event)
            : undefined
        }
      >
        {token.value}
      </a>
    );
  }

  return (
    <span className={className} style={inlineStyle}>
      {token.value}
    </span>
  );
}

function rowClassName(line: SurfaceLine, isWatched: boolean): string {
  return [
    styles.row,
    line.isCollapsed ? styles.rowCollapsed : "",
    isWatched ? styles.rowWatched : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function toWatchSet(source: ReadonlySet<number> | readonly number[]): Set<number> {
  return source instanceof Set ? new Set(source) : new Set(source);
}

export function CodeSurface({
  lines,
  gutterLineCount,
  tokenColor,
  onToggleCollapse,
  gutterIcons,
  indent,
  height,
  maxHeight,
  linkify = true,
  onLinkClick,
  watchlist: watchlistProp,
  defaultWatchlist,
  onWatchlistChange,
  theme,
  surfaceVariant = "default",
  "aria-label": ariaLabel,
}: CodeSurfaceProps) {
  const tokens = useTheme(theme);

  const scrollRef = useRef<HTMLElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const watchlistEnabled =
    watchlistProp != null || defaultWatchlist != null || onWatchlistChange != null;

  const [internalWatchlist, setInternalWatchlist] = useState(
    () => new Set(defaultWatchlist ?? []),
  );

  const watchedLines = useMemo(() => {
    if (watchlistProp != null) return toWatchSet(watchlistProp);
    return internalWatchlist;
  }, [watchlistProp, internalWatchlist]);

  function toggleWatchlistLine(lineNumber: number) {
    const next = new Set(watchedLines);
    if (next.has(lineNumber)) {
      next.delete(lineNumber);
    } else {
      next.add(lineNumber);
    }
    if (watchlistProp == null) {
      setInternalWatchlist(next);
    }
    onWatchlistChange?.(next);
  }

  const isConstrained = height != null || maxHeight != null;

  const displayLines = useMemo(() => annotateBracketDepth(lines), [lines]);

  const useVirtual =
    isConstrained && displayLines.length > CODE_SURFACE_VIRTUAL_THRESHOLD;

  const frameStyle = useMemo(() => {
    const style: React.CSSProperties = {
      ...(theme
        ? {
            ...syntaxColorsCubeOverride(tokens),
            ...codeBlockTypographyCubeOverride(tokens),
          }
        : {}),
      ...(indent != null
        ? ({ "--code-surface-indent": indent } as React.CSSProperties)
        : {}),
      ...(height != null ? { height } : {}),
      ...(maxHeight != null ? { maxHeight } : {}),
    };
    return Object.keys(style).length > 0 ? style : undefined;
  }, [theme, tokens, indent, height, maxHeight]);

  useEffect(() => {
    if (document.getElementById(CODE_SURFACE_SCROLL_STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = CODE_SURFACE_SCROLL_STYLE_ID;
    el.textContent = CODE_SURFACE_SCROLL_CSS;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    if (!useVirtual) return;
    const el = scrollRef.current;
    if (!el) return;

    const updateViewport = () => setViewportHeight(el.clientHeight);
    updateViewport();

    const ro = new ResizeObserver(updateViewport);
    ro.observe(el);
    return () => ro.disconnect();
  }, [useVirtual, height, maxHeight]);

  const gutterChars = String(Math.max(gutterLineCount, 1)).length;
  const showCollapseColumn = onToggleCollapse != null;
  const collapsedIcon = gutterIcons?.collapsed ?? (
    <Icon size="xs">
      <ChevronRightIcon />
    </Icon>
  );
  const expandedIcon = gutterIcons?.expanded ?? (
    <Icon size="xs">
      <ExpandMoreIcon />
    </Icon>
  );

  const { startIdx, endIdx } = useMemo(() => {
    if (!useVirtual) {
      return { startIdx: 0, endIdx: displayLines.length };
    }
    const start = Math.max(
      0,
      Math.floor(scrollTop / CODE_SURFACE_ROW_HEIGHT_PX) - CODE_SURFACE_OVERSCAN,
    );
    const end = Math.min(
      displayLines.length,
      Math.ceil((scrollTop + viewportHeight) / CODE_SURFACE_ROW_HEIGHT_PX) +
        CODE_SURFACE_OVERSCAN,
    );
    return { startIdx: start, endIdx: Math.max(start, end) };
  }, [useVirtual, displayLines.length, scrollTop, viewportHeight]);

  const visibleLines = useVirtual ? displayLines.slice(startIdx, endIdx) : displayLines;
  const totalContentHeight = displayLines.length * CODE_SURFACE_ROW_HEIGHT_PX;

  function renderRow(line: SurfaceLine, absoluteIdx: number) {
    const isWatched = watchedLines.has(line.lineNumber);

    return (
      <Stack
        key={absoluteIdx}
        direction="horizontal"
        align="stretch"
        gap="none"
        className={rowClassName(line, isWatched)}
      >
        <Box
          direction="horizontal"
          align="center"
          gap="none"
          className={
            watchlistEnabled
              ? `${styles.gutter} ${styles.gutterWithWatch}`
              : styles.gutter
          }
        >
          {watchlistEnabled ? (
            <Tooltip
              content={
                isWatched ? "Remove from watchlist" : "Add to watchlist"
              }
              placement="right"
              compact
              theme={theme}
            >
              <button
                type="button"
                className={
                  isWatched
                    ? `${styles.watchBtn} ${styles.watchBtnActive}`
                    : styles.watchBtn
                }
                aria-label={
                  isWatched
                    ? `Remove line ${line.lineNumber} from watchlist`
                    : `Add line ${line.lineNumber} to watchlist`
                }
                aria-pressed={isWatched}
                onClick={() => toggleWatchlistLine(line.lineNumber)}
              >
                <span aria-hidden className={styles.watchDot} />
              </button>
            </Tooltip>
          ) : null}

          <span
            aria-hidden
            className={styles.lineNumber}
            style={{ minWidth: `${gutterChars}ch` }}
          >
            {line.lineNumber}
          </span>

          {showCollapseColumn ? (
            line.collapseKey != null ? (
              <button
                type="button"
                aria-label={line.isCollapsed ? "Expand node" : "Collapse node"}
                onClick={() => onToggleCollapse!(line.collapseKey!)}
                className={styles.collapseBtn}
              >
                {line.isCollapsed ? collapsedIcon : expandedIcon}
              </button>
            ) : (
              <span aria-hidden className={styles.collapseSpacer} />
            )
          ) : null}
        </Box>

        <Box
          direction="horizontal"
          align="center"
          gap="none"
          className={styles.content}
          style={
            { "--code-line-depth": line.depth } as React.CSSProperties
          }
        >
          {line.tokens.map((token, i) => (
            <React.Fragment key={i}>
              {renderSurfaceToken(token, { linkify, tokenColor, onLinkClick })}
            </React.Fragment>
          ))}
        </Box>
      </Stack>
    );
  }

  const rowList = (
    <>{visibleLines.map((line, i) => renderRow(line, startIdx + i))}</>
  );

  return (
    <Box
      role="region"
      aria-label={ariaLabel ?? "Code"}
      borderColor={surfaceVariant === "embedded" ? undefined : "border.gray.2"}
      borderRadius={surfaceVariant === "embedded" ? undefined : "md"}
      overflow="hidden"
      direction="vertical"
      gap="none"
      className={styles.CodeSurface}
      style={frameStyle}
      theme={theme}
    >
      <Box
        ref={scrollRef}
        grow
        background="bg.gray.light.1"
        className={`${CODE_SURFACE_SCROLL_CLASS} ${styles.scroll} ${
          isConstrained ? styles.scrollConstrained : ""
        }`}
        onScroll={
          useVirtual
            ? (e) => setScrollTop(e.currentTarget.scrollTop)
            : undefined
        }
      >
        {useVirtual ? (
          <Box
            className={styles.virtualWindow}
            style={{ height: totalContentHeight }}
            gap="none"
          >
            <Box
              className={styles.virtualSlice}
              gap="none"
              style={{ top: startIdx * CODE_SURFACE_ROW_HEIGHT_PX }}
            >
              {rowList}
            </Box>
          </Box>
        ) : (
          rowList
        )}
      </Box>
    </Box>
  );
}
