/** Fixed row height — must match CodeSurface row styles (1.625rem at 16px root). */
export const CODE_SURFACE_ROW_HEIGHT_PX = 26;

/** Enable windowed rendering when line count exceeds this in a constrained container. */
export const CODE_SURFACE_VIRTUAL_THRESHOLD = 80;

/** Extra rows rendered above/below the visible window. */
export const CODE_SURFACE_OVERSCAN = 8;

export const CODE_SURFACE_SCROLL_CLASS = "cube-code-surface-scroll";
export const CODE_SURFACE_SCROLL_STYLE_ID = "cube-code-surface-scroll-styles";

export const CODE_SURFACE_INDENT = "1.5rem";
export const CODE_SURFACE_WATCH_DOT_PX = 6;

export const CODE_SURFACE_SCROLL_CSS = `
  .${CODE_SURFACE_SCROLL_CLASS}::-webkit-scrollbar { width: 4px; height: 4px; }
  .${CODE_SURFACE_SCROLL_CLASS}::-webkit-scrollbar-track { background: transparent; }
  .${CODE_SURFACE_SCROLL_CLASS}::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.18);
    border-radius: 3px;
  }
  .${CODE_SURFACE_SCROLL_CLASS}::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.32); }
`;
