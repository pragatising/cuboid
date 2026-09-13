import type { Preview } from "@storybook/react";
import { create, themes, typography as sbTypography } from "@storybook/theming";
import "../src/theme/output/theme.css";
import "../src/theme/output/components.css";
import "../src/theme/output/icon-fonts.css";
import "./docs.css";

/**
 * Preview iframe (canvas + docs content).
 *
 * Styling layers:
 * - theme.css       — globals, shadows, size, typography
 * - components.css  — component color tokens + selector rules (e.g. pill)
 * - icon-fonts.css  — self-hosted Material Symbols variable font (@font-face only,
 *                     shipped as a static stylesheet — see its header comment)
 * - docs.css        — Storybook docs prose, inline code, section utilities
 * - preview-head.html — Inter webfont (matches token base family)
 *
 * Storybook shell (sidebar) → manager.ts + managerHead in main.ts
 */

const cubeFontBase =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Matches --cube-typography-text-body-sm-fontSize (14px @ 16px root). */
const bodySmPx = 14;

/** create() input types omit typography, but the returned theme uses it at runtime. */
type DocsTheme = ReturnType<typeof create> & { typography: typeof sbTypography };

/**
 * Docs blocks read typography.size.* from @storybook/blocks:
 * - Title     → m3 / l1
 * - Subtitle  → s3 / m1  (why subtitle was 16px → 20px in devtools)
 * - DocsContent body → s3
 */
const docsTheme = create({
  ...themes.light,
  fontBase: cubeFontBase,
  // Storybook's theme derives shades via `polished`, which only accepts
  // hex/rgb/rgba/hsl/hsla — the "transparent" keyword throws deep inside
  // @storybook/blocks. rgba(0,0,0,0) renders identically and is parseable.
  appBorderColor: "rgba(0,0,0,0)",
}) as DocsTheme;

docsTheme.typography = {
  ...sbTypography,
  fonts: {
    ...sbTypography.fonts,
    base: cubeFontBase,
  },
  size: {
    ...sbTypography.size,
    s3: bodySmPx,
    m1: bodySmPx,
    m3: bodySmPx,
    l1: bodySmPx,
  },
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: docsTheme,
      canvas: {
        sourceState: "shown",
      },
    },
  },
};

export default preview;
