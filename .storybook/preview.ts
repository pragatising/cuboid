import type { Preview } from "@storybook/react";
import "../src/theme/output/theme.css";

// Inter is loaded via .storybook/preview-head.html (injected into the iframe <head>).
// In production, consumers load Inter themselves — see README for options.

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
