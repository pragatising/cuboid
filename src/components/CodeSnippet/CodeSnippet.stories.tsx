import type { Meta, StoryObj } from "@storybook/react";
import { CodeSnippet } from "./CodeSnippet";
import devServerDiagnostics from "./__fixtures__/dev-server-diagnostics";

const meta: Meta<typeof CodeSnippet> = {
  title: "Components/CodeSnippet",
  component: CodeSnippet,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    defaultCollapsed: { control: "boolean" },
    height:    { control: "text", description: "Fixed height — content scrolls inside (e.g. \"400px\", \"50vh\")" },
    maxHeight: { control: "text", description: "Max height — scrolls only when content exceeds it" },
    icons:     { control: false },
    theme:     { control: false },
    data:      { control: false },
  },
};
export default meta;
type Story = StoryObj<typeof CodeSnippet>;

/** Dev-server diagnostics snapshot — all nodes expanded by default */
export const DevServerDiagnostics: Story = {
  args: {
    data: devServerDiagnostics,
    defaultCollapsed: false,
    height: "600px",
  },
};

/** Same snapshot starting fully collapsed — drill into sections individually */
export const DevServerCollapsed: Story = {
  args: {
    data: devServerDiagnostics,
    defaultCollapsed: true,
  },
};

/** Build output with chunk list — good for testing array expand/collapse */
export const BuildOutput: Story = {
  args: {
    data: devServerDiagnostics.build,
  },
};

/** TypeScript compiler options — nested config object */
export const TypeScriptConfig: Story = {
  args: {
    data: devServerDiagnostics.typescript,
  },
};

/** Top-level project metadata — shallow object */
export const ProjectMetadata: Story = {
  args: {
    data: devServerDiagnostics.project,
  },
};

/** Fills the full viewport height — simulates being dropped into a page layout */
export const FullViewportHeight: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ height: "100vh" }}>
      <CodeSnippet data={devServerDiagnostics} height="100%" />
    </div>
  ),
};

/** Dark theme override */
export const DarkTheme: Story = {
  args: {
    data: devServerDiagnostics,
    defaultCollapsed: true,
    theme: {
      colors: {
        functional: {
          background: { muted: "#0d1117" },
          foreground: {
            default: "#e6edf3",
            muted:   "#8b949e",
            disabled: "#484f58",
          },
          border: {
            default: "#30363d",
            muted:   "#21262d",
          },
          syntax: {
            constant: "#79c0ff",
            string:   "#a5d6ff",
            variable: "#ffa657",
            keyword:  "#ff7b72",
          },
        },
      },
    },
  },
};
