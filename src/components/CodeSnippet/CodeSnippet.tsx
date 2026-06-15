import React, { useState, useMemo } from "react";
import { CodeSurface } from "../CodeBlock/CodeSurface";
import type { CubeTheme } from "../../theme/types";
import { buildLines, getAllCollapsiblePaths } from "./tokenizer";

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
   */
  icons?: {
    collapsed?: React.ReactNode;
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

export function CodeSnippet({
  data,
  defaultCollapsed = false,
  icons,
  height,
  maxHeight,
  theme,
  "aria-label": ariaLabel,
}: CodeSnippetProps) {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() =>
    defaultCollapsed ? getAllCollapsiblePaths(data) : new Set(),
  );

  function togglePath(path: string) {
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  const lines = useMemo(
    () => buildLines(data, collapsedPaths),
    [data, collapsedPaths],
  );

  const gutterLineCount = useMemo(
    () => buildLines(data, new Set()).length,
    [data],
  );

  return (
    <CodeSurface
      lines={lines}
      gutterLineCount={gutterLineCount}
      onToggleCollapse={togglePath}
      gutterIcons={icons}
      height={height}
      maxHeight={maxHeight}
      theme={theme}
      aria-label={ariaLabel ?? "JSON viewer"}
    />
  );
}
