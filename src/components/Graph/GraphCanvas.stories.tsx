import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { GraphCanvas } from "./GraphCanvas";
import { GraphCard } from "./GraphCard";
import { GraphRow } from "./GraphRow";
import { GraphHandle } from "./GraphHandle";
import { GraphEdge } from "./GraphEdge";

/**
 * GraphCanvas — generic, use-case agnostic canvas primitives.
 *
 * These stories demonstrate the mechanics of the graph system:
 * pan/zoom, handle registration, and edge drawing.
 *
 * GraphCard already has sensible visual defaults from the theme
 * (background, border, shadow, padding, gap) so it looks good
 * with any ReactNode as children.
 *
 * For the JSON-specific content layer (JsonCardTitle, JsonFieldRow,
 * JsonObjectRow) see the JsonGraph stories.
 */
const meta: Meta<typeof GraphCanvas> = {
  title: "Graph/GraphCanvas",
  component: GraphCanvas,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof GraphCanvas>;

// ── Story: two cards connected by a row-level handle ──────────────────────────

const TwoCardsRender = () => (
  <GraphCanvas height="100vh" defaultPan={{ x: 60, y: 80 }}>

    <GraphCard id="a" x={0} y={0}>
      <GraphRow>Row one</GraphRow>
      <GraphRow>Row two</GraphRow>
      <GraphRow>
        Link to card B
        <GraphHandle id="out" side="right" />
      </GraphRow>
    </GraphCard>

    <GraphCard id="b" x={380} y={140}>
      <GraphHandle id="in" side="left" />
      <GraphRow>Received content</GraphRow>
      <GraphRow>Another row</GraphRow>
    </GraphCard>

    <GraphEdge
      from={{ node: "a", handle: "out" }}
      to={{ node: "b", handle: "in" }}
    />

  </GraphCanvas>
);

export const TwoCards: Story = { render: () => <TwoCardsRender /> };

// ── Story: three cards, two edges ─────────────────────────────────────────────

const ThreeCardsRender = () => (
  <GraphCanvas height="100vh" defaultPan={{ x: 60, y: 60 }}>

    <GraphCard id="root" x={0} y={0}>
      <GraphRow>Root card</GraphRow>
      <GraphRow>
        Link to A
        <GraphHandle id="link-a" side="right" />
      </GraphRow>
      <GraphRow>
        Link to B
        <GraphHandle id="link-b" side="right" />
      </GraphRow>
    </GraphCard>

    <GraphCard id="child-a" x={380} y={0}>
      <GraphHandle id="in" side="left" />
      <GraphRow>Child A</GraphRow>
      <GraphRow>Row two</GraphRow>
    </GraphCard>

    <GraphCard id="child-b" x={380} y={180}>
      <GraphHandle id="in" side="left" />
      <GraphRow>Child B</GraphRow>
      <GraphRow>Row two</GraphRow>
    </GraphCard>

    <GraphEdge
      from={{ node: "root",    handle: "link-a" }}
      to={{ node: "child-a", handle: "in" }}
    />
    <GraphEdge
      from={{ node: "root",    handle: "link-b" }}
      to={{ node: "child-b", handle: "in" }}
    />

  </GraphCanvas>
);

export const ThreeCards: Story = { render: () => <ThreeCardsRender /> };
