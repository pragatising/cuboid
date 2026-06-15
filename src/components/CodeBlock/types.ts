/**
 * Language-agnostic line model for CodeSurface.
 * Producers (JsonCodeView tokenizer, CodeBlock highlighters) build these;
 * CodeSurface only renders them.
 */

export interface SurfaceToken {
  type: string;
  value: string;
  /**
   * Nesting index for `{ } [ ] ( )` — set by {@link annotateBracketDepth} in `./syntax`.
   * Drives alternating bracket colours in CodeSurface.
   */
  bracketDepth?: number;
}

export interface SurfaceLine {
  /** 1-indexed line number shown in the gutter. */
  lineNumber: number;
  /** Nesting depth — drives visual indentation. */
  depth: number;
  tokens: SurfaceToken[];
  /**
   * When set, the gutter shows a collapse toggle for this line.
   * The parent passes `onToggleCollapse` to handle clicks.
   */
  collapseKey?: string;
  isCollapsed?: boolean;
  kind?: "summary";
}
