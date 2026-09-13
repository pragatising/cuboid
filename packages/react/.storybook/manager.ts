import { addons } from "@storybook/manager-api";
import { themes } from "@storybook/theming";

/**
 * Storybook shell (sidebar, toolbar, search) — separate from preview iframe styling.
 * Inter is loaded via managerHead in main.ts to match theme.css base font.
 */
addons.setConfig({
  theme: {
    ...themes.light,
    fontBase:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    fontCode:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    colorPrimary: "#474746",
    colorSecondary: "#474746",
    appBg: "#FFFFFF",
    appContentBg: "#FFFFFF",
    barBg: "#FFFFFF",
    inputBg: "#F9F9F8",
    inputBorder: "#D8D7D4",
    textColor: "#2D2D2D",
    textMutedColor: "#6F6F6D",
  },
});
