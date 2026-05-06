import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "../../theme/ThemeContext";
import type { CubeTheme } from "../../theme/types";
import { buildLines, getAllCollapsiblePaths } from "./tokenizer";
import type { TokenType } from "./tokenizer";

const SCROLL_CLASS = "cube-cs-scroll";
const SCROLL_STYLE_ID = "cube-cs-scroll-styles";
const SCROLL_CSS = `
  .${SCROLL_CLASS}::-webkit-scrollbar { width: 4px; height: 4px; }
  .${SCROLL_CLASS}::-webkit-scrollbar-track { background: transparent; }
  .${SCROLL_CLASS}::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.18);
    border-radius: 3px;
  }
  .${SCROLL_CLASS}::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.32); }
`;

export interface CodeSnippetProps {
  /** Any JSON-serialisable value */
  data: unknown;
  /**
   * Start with all collapsible nodes collapsed.
   * The user can then expand nodes individually.
   * @default false
   */
  defaultCollapsed?: boolean;
  /**
   * Replace the built-in chevron icons with your own SVG components.
   * You are responsible for sizing and coloring them.
   *
   * @example
   * ```tsx
   * import { ChevronRight, ChevronDown } from "lucide-react";
   *
   * <CodeSnippet
   *   data={data}
   *   icons={{
   *     collapsed: <ChevronRight size={16} />,
   *     expanded:  <ChevronDown size={16} />,
   *   }}
   * />
   * ```
   */
  icons?: {
    /** Shown when the node is collapsed. Defaults to a Material Design ChevronRight. */
    collapsed?: React.ReactNode;
    /** Shown when the node is expanded. Defaults to a Material Design ExpandMore. */
    expanded?: React.ReactNode;
  };
  /**
   * Fix the component to an exact height — content scrolls inside.
   * Accepts any valid CSS value (e.g. "400px", "50vh", "20rem").
   */
  height?: string;
  /**
   * Cap the component height — content scrolls only when it exceeds this value.
   * Accepts any valid CSS value (e.g. "400px", "50vh", "20rem").
   */
  maxHeight?: string;
  /** Override any theme tokens for this instance */
  theme?: CubeTheme;
  /** Accessible label for the code region */
  "aria-label"?: string;
}

// How much each depth level indents (in addition to the base padding)
const INDENT = "1.5rem";

// Material Design chevron icons — official SVG paths, no external dependency
function ChevronRight({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden
      style={{ display: "block" }}
    >
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
}

function ChevronDown({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden
      style={{ display: "block" }}
    >
      <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </svg>
  );
}

export function CodeSnippet({
  data,
  defaultCollapsed = false,
  icons,
  height,
  maxHeight,
  theme,
  "aria-label": ariaLabel,
}: CodeSnippetProps) {
  const tokens = useTheme(theme);
  const { functional } = tokens.colors;
  const { text, fontFamily } = tokens.typography;

  // ── Scrollbar styles ─────────────────────────────────────────────────────────
  // Injected via useEffect so it always targets the correct document (important
  // inside Storybook's iframe or any shadow-root-like context).
  useEffect(() => {
    if (document.getElementById(SCROLL_STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = SCROLL_STYLE_ID;
    el.textContent = SCROLL_CSS;
    document.head.appendChild(el);
  }, []);

  // ── Collapse state ──────────────────────────────────────────────────────────
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() =>
    defaultCollapsed ? getAllCollapsiblePaths(data) : new Set()
  );

  // ── Hover state ─────────────────────────────────────────────────────────────
  // A single index rather than per-row booleans — only one row can be hovered
  // at a time, and a single state change re-renders only the two affected rows.
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  function togglePath(path: string) {
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  // ── Line generation ─────────────────────────────────────────────────────────
  // Re-runs whenever data or collapse state changes.
  // Line numbers are recomputed in the same pass so they are always sequential.
  const lines = useMemo(
    () => buildLines(data, collapsedPaths),
    [data, collapsedPaths]
  );

  // Gutter width is fixed to the fully-expanded line count so it never shifts
  // when nodes are collapsed and the visible line count shrinks.
  const totalLines = useMemo(() => buildLines(data, new Set()).length, [data]);
  const gutterChars = String(totalLines).length;

  // ── Token → theme color ─────────────────────────────────────────────────────
  function tokenColor(type: TokenType): string {
    const s = functional.syntax;
    switch (type) {
      case "key":          return s.key;
      case "string":       return s.string;
      case "string_url":   return s.stringUrl;
      case "string_email": return s.stringEmail;
      case "string_uuid":  return s.stringUuid;
      case "number":       return s.variable;
      case "boolean":      return s.booleanLiteral;
      case "null":         return s.nullLiteral;
      case "bracket":      return s.bracket;
      case "operator":     return functional.foreground.muted;
      case "punctuation":  return functional.foreground.muted;
      case "ellipsis":     return functional.foreground.muted;
    }
  }

  const chevronColor = functional.foreground.muted;
  // Fixed width reserved for the chevron column inside the gutter
  const CHEVRON_WIDTH = "1.25rem";

  const collapsedIcon = icons?.collapsed ?? <ChevronRight color={chevronColor} />;
  const expandedIcon  = icons?.expanded  ?? <ChevronDown  color={chevronColor} />;

  const isConstrained = height != null || maxHeight != null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      role="region"
      aria-label={ariaLabel ?? "JSON viewer"}
      style={{
        border: `${tokens.sizes.borderWidth.thin} solid ${functional.border.default}`,
        borderRadius: tokens.sizes.borderRadius.lg,
        fontFamily: text.codeBlock.fontFamily ?? fontFamily.mono,
        fontSize: text.codeBlock.fontSize,
        lineHeight: text.codeBlock.lineHeight,
        // Clips child content to the rounded corners
        overflow: "hidden",
        height,
        maxHeight,
        // Needed so the inner scroll div can fill the full height
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Scrollable content area — fills the frame and scrolls when constrained */}
      <div
        className={SCROLL_CLASS}
        style={{
          background: functional.background.default,
          overflowX: "auto",
          overflowY: isConstrained ? "auto" : "visible",
          overscrollBehavior: "none",
          // Firefox: thin scrollbar with subtle thumb
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0,0,0,0.18) transparent",
          flex: 1,
          userSelect: "text",
        }}
      >
      {lines.map((line, idx) => {
        const isHovered = hoveredIdx === idx;
        const rowBg = isHovered
          ? functional.syntax.rowHoverBg
          : line.isCollapsed
          ? functional.background.inset
          : undefined;

        return (
        <div
          key={idx}
          onMouseEnter={() => setHoveredIdx(idx)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{ display: "flex", alignItems: "stretch", minHeight: "1.625rem" }}
        >
          {/* ── Gutter: [line number] [chevron] ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              position: "sticky",
              left: 0,
              zIndex: 1,
              paddingLeft: tokens.sizes.space[3],
              paddingRight: tokens.sizes.space[2],
              borderRight: `${tokens.sizes.borderWidth.thin} solid ${functional.border.muted}`,
              userSelect: "none",
              color: functional.foreground.disabled,
              // Explicit background required — sticky elements must opaque their own bg
              // so scrolling content doesn't bleed through behind them.
              background: rowBg ?? functional.background.default,
            }}
          >
            {/* Line number — right-aligned in its own fixed-width cell */}
            <span
              aria-hidden
              style={{
                display: "inline-block",
                minWidth: `${gutterChars}ch`,
                textAlign: "right",
                paddingRight: tokens.sizes.space[2],
              }}
            >
              {line.lineNumber}
            </span>

            {/* Chevron toggle — or invisible spacer so all code starts at the same X */}
            {line.collapseKey != null ? (
              <button
                aria-label={line.isCollapsed ? "Expand node" : "Collapse node"}
                onClick={() => togglePath(line.collapseKey!)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: CHEVRON_WIDTH,
                  alignSelf: "stretch",
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: chevronColor,
                }}
              >
                {line.isCollapsed ? collapsedIcon : expandedIcon}
              </button>
            ) : (
              <span
                aria-hidden
                style={{ display: "inline-block", width: CHEVRON_WIDTH, flexShrink: 0 }}
              />
            )}
          </div>

          {/* ── Code content: indentation + tokens only ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              paddingLeft: `calc(${tokens.sizes.space[3]} + ${line.depth} * ${INDENT})`,
              paddingRight: tokens.sizes.space[4],
              background: rowBg,
            }}
          >
            {line.tokens.map((token, i) => (
              <span
                key={i}
                style={{ color: tokenColor(token.type), whiteSpace: "pre" }}
              >
                {token.value}
              </span>
            ))}
          </div>
        </div>
        );
      })}
      </div>
    </div>
  );
}
