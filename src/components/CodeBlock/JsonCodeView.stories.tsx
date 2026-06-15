import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Title, Primary, Controls, Subtitle } from "@storybook/blocks";
import { JsonCodeView } from "./JsonCodeView";
import {
  CodeViewingArchitectureSection,
  CodeViewingDocsSubtitle,
} from "./CodeViewingDocs";
import devServerDiagnostics from "./__fixtures__/dev-server-diagnostics";

const meta: Meta<typeof JsonCodeView> = {
  title: "Components/CodeBlock/JsonCodeView",
  component: JsonCodeView,
  tags: ["autodocs"],
  argTypes: {
    defaultCollapsed: { control: "boolean" },
    height: {
      control: "text",
      description: 'Fixed height — content scrolls inside (e.g. "400px", "50vh")',
    },
    maxHeight: {
      control: "text",
      description: "Max height — scrolls only when content exceeds it",
    },
    gutterIcons: { control: false },
    theme: { control: false },
    data: { control: false },
    onWatchlistChange: { control: false },
    onLinkClick: { control: false },
  },
  parameters: {
    layout: "padded",
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle>
            <CodeViewingDocsSubtitle focus="jsonCodeView" />
          </Subtitle>
          <CodeViewingArchitectureSection focus="jsonCodeView" />
          <Primary />
          <Controls />
        </>
      ),
    },
  },
};
export default meta;
type Story = StoryObj<typeof JsonCodeView>;

/** Dev-server diagnostics snapshot — all nodes expanded by default */
export const DevServerDiagnostics: Story = {
  args: {
    data: devServerDiagnostics,
    defaultCollapsed: false,
    height: "600px",
  },
};

/** Same snapshot starting fully collapsed — expand sections individually */
export const DevServerCollapsed: Story = {
  args: {
    data: devServerDiagnostics,
    defaultCollapsed: true,
  },
};

/** Build output with chunk list — array expand/collapse */
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

/** Top-level project metadata — shallow object, includes clickable URLs */
export const ProjectMetadata: Story = {
  args: {
    data: devServerDiagnostics.project,
    maxHeight: "320px",
  },
};

/** Full viewport height — simulates a page layout slot */
export const FullViewportHeight: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ height: "100vh" }}>
      <JsonCodeView data={devServerDiagnostics} height="100%" />
    </div>
  ),
};

/** Watchlist gutter — click dots to mark lines */
export const WithWatchlist: Story = {
  render: function Render() {
    const [watchlist, setWatchlist] = useState<Set<number>>(
      () => new Set([5, 12]),
    );
    return (
      <JsonCodeView
        data={devServerDiagnostics.project}
        maxHeight="320px"
        watchlist={watchlist}
        onWatchlistChange={setWatchlist}
      />
    );
  },
};
