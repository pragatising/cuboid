import type { Preview } from "@storybook/react";
import { create, themes, typography as sbTypography } from "@storybook/theming";
import "../src/theme/output/theme.css";
import "./docs.css";

/**
 * Preview iframe (canvas + docs content).
 *
 * Styling layers:
 * - theme.css  — Cube design tokens + component CSS variables
 * - docs.css   — Storybook docs prose, inline code, section utilities
 * - preview-head.html — Inter webfont (matches token base family)
 *
 * Storybook shell (sidebar) → manager.ts + managerHead in main.ts
 */

const cubeFontBase =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Matches --cube-typography-text-body-medium-fontSize (14px @ 16px root). */
const bodyMediumPx = 14;

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
  appBorderColor: "transparent",
}) as DocsTheme;

docsTheme.typography = {
  ...sbTypography,
  fonts: {
    ...sbTypography.fonts,
    base: cubeFontBase,
  },
  size: {
    ...sbTypography.size,
    s3: bodyMediumPx,
    m1: bodyMediumPx,
    m3: bodyMediumPx,
    l1: bodyMediumPx,
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
