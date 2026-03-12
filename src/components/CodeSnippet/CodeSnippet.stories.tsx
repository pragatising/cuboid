import type { Meta, StoryObj } from "@storybook/react";
import { CodeSnippet } from "./CodeSnippet";
import deviceProfileReport from "./__fixtures__/device-profile-report";

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

/** Real-world shaped device profile report — all nodes expanded by default */
export const DeviceProfileReport: Story = {
  args: {
    data: deviceProfileReport,
    defaultCollapsed: false,
    height: "600px",
  },
};

/** Same report starting fully collapsed — drill into sections individually */
export const DeviceProfileCollapsed: Story = {
  args: {
    data: deviceProfileReport,
    defaultCollapsed: true,
  },
};

/** Just the nested sections that benefit most from expand/collapse */
export const PolicyDetails: Story = {
  args: {
    data: deviceProfileReport.data.policy_details_api,
  },
};

export const VelocityVariables: Story = {
  args: {
    data: deviceProfileReport.data.ng_variables,
  },
};

export const KeyAttributes: Story = {
  args: {
    data: deviceProfileReport.keyAttributes,
  },
};

/** Fills the full viewport height — simulates being dropped into a page layout */
export const FullViewportHeight: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ height: "100vh" }}>
      <CodeSnippet data={deviceProfileReport} height="100%" />
    </div>
  ),
};

/** Dark theme override */
export const DarkTheme: Story = {
  args: {
    data: deviceProfileReport,
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
