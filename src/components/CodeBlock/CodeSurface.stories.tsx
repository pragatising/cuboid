import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CodeSurface } from "./CodeSurface";
import type { SurfaceLine } from "./types";
import { buildLines } from "../CodeSnippet/tokenizer";
import devServerDiagnostics from "../CodeSnippet/__fixtures__/dev-server-diagnostics";
import { defaultTheme } from "../../theme/defaultTheme";

const meta: Meta<typeof CodeSurface> = {
  title: "Components/CodeBlock/CodeSurface",
  component: CodeSurface,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    height: { control: "text" },
    maxHeight: { control: "text" },
    linkify: { control: "boolean" },
    theme: { control: false },
    tokenColor: { control: false },
    onToggleCollapse: { control: false },
    onLinkClick: { control: false },
    onWatchlistChange: { control: false },
  },
};
export default meta;
type Story = StoryObj<typeof CodeSurface>;

function flatMockLines(count: number): SurfaceLine[] {
  return Array.from({ length: count }, (_, i) => ({
    lineNumber: i + 1,
    depth: 0,
    tokens: [
      { type: "key", value: `"field_${i}"` },
      { type: "operator", value: ": " },
      { type: "number", value: String(i * 42) },
      { type: "punctuation", value: i < count - 1 ? "," : "" },
    ],
  }));
}

/** Realistic JSON — URLs/emails in string values are clickable (`linkify` default). */
export const ProjectMetadata: Story = {
  render: () => {
    const lines = buildLines(devServerDiagnostics.project, new Set());
    return (
      <CodeSurface
        lines={lines}
        gutterLineCount={lines.length}
        maxHeight="320px"
      />
    );
  },
};

/** 5 000 flat lines — windowed rendering */
export const LargeVirtualised: Story = {
  render: () => (
    <CodeSurface
      lines={flatMockLines(5000)}
      gutterLineCount={5000}
      height="480px"
    />
  ),
};

/** Collapse toggles in the gutter */
export const WithCollapseToggles: Story = {
  render: function Render() {
    const [collapsed, setCollapsed] = useState(false);

    const lines: SurfaceLine[] = [
      {
        lineNumber: 1,
        depth: 0,
        collapseKey: "root",
        isCollapsed: collapsed,
        tokens: [{ type: "bracket", value: "{" }],
      },
      ...(collapsed
        ? []
        : [
            {
              lineNumber: 2,
              depth: 1,
              tokens: [
                { type: "key", value: '"name"' },
                { type: "operator", value: ": " },
                { type: "string", value: '"Cube"' },
              ],
            },
            {
              lineNumber: 3,
              depth: 1,
              tokens: [
                { type: "key", value: '"version"' },
                { type: "operator", value: ": " },
                { type: "number", value: "1" },
              ],
            },
          ]),
      {
        lineNumber: collapsed ? 2 : 4,
        depth: 0,
        tokens: [{ type: "bracket", value: "}" }],
      },
    ];

    return (
      <CodeSurface
        lines={lines}
        gutterLineCount={4}
        height="200px"
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />
    );
  },
};

/** Click gutter dots to mark lines — watchMark dot when active, watchMarkHover preview on hover. */
export const WithWatchlist: Story = {
  render: function Render() {
    const [watchlist, setWatchlist] = useState<Set<number>>(() => new Set([3, 7]));

    const lines = buildLines(devServerDiagnostics.project, new Set());
    return (
      <CodeSurface
        lines={lines}
        gutterLineCount={lines.length}
        maxHeight="320px"
        watchlist={watchlist}
        onWatchlistChange={setWatchlist}
      />
    );
  },
};

/** Partial instance override — swaps surface tokens from the built theme (no ad-hoc hex). */
export const InsetSurfaceOverride: Story = {
  render: () => {
    const { background, border } = defaultTheme.colors.functional;
    const lines = buildLines(devServerDiagnostics.project, new Set());
    return (
      <CodeSurface
        lines={lines}
        gutterLineCount={lines.length}
        maxHeight="320px"
        theme={{
          colors: {
            functional: {
              background: {
                default: background.inset,
              },
              border: {
                muted: border.emphasis,
              },
            },
          },
        }}
      />
    );
  },
};
