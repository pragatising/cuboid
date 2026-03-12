import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { GraphCanvas } from "../Graph/GraphCanvas";
import { GraphCard } from "../Graph/GraphCard";
import { GraphHandle } from "../Graph/GraphHandle";
import { GraphEdge } from "../Graph/GraphEdge";
import { JsonCardTitle, JsonFieldRow, JsonObjectRow, JsonInputHandle } from "./index";

/**
 * JsonGraph — JSON-specific content layer on top of the generic Graph primitives.
 *
 * `GraphCard` provides the canvas positioning, themed shell (border, shadow,
 * padding, gap). The Json* components define *what goes inside*:
 *
 * - `JsonCardTitle`  — card heading
 * - `JsonFieldRow`   — primitive key + value pair
 * - `JsonObjectRow`  — nested-object link row with inset background and a handle slot
 *
 * Consumers compose these freely inside any `GraphCard`. Themes are inherited
 * from the nearest `ThemeProvider`.
 */
const meta: Meta = {
  title: "JsonGraph/JsonCard",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

// ── Story: two cards, one nested-object link ──────────────────────────────────

const TwoCardsRender = () => (
  <GraphCanvas height="100vh" defaultPan={{ x: 60, y: 80 }}>

    <GraphCard id="device" x={0} y={0}>
      <JsonCardTitle>Device</JsonCardTitle>
      <JsonFieldRow label="risk_rating"         value="neutral" />
      <JsonFieldRow label="device_score"        value="active" />
      <JsonFieldRow label="account_risk_score"  value="85" />
      <JsonFieldRow label="account_trust_score" value="915" />
      <JsonObjectRow label="Email Details">
        <GraphHandle id="email-out" side="right" />
      </JsonObjectRow>
    </GraphCard>

    <GraphCard id="email" x={400} y={160}>
      <JsonCardTitle>
        <JsonInputHandle id="in" />
        Email Details
      </JsonCardTitle>
      <JsonFieldRow label="email"    value="user@example.com" />
      <JsonFieldRow label="domain"   value="example.com" />
      <JsonFieldRow label="verified" value="true" />
    </GraphCard>

    <GraphEdge
      from={{ node: "device", handle: "email-out" }}
      to={{ node: "email",   handle: "in" }}
    />

  </GraphCanvas>
);

export const TwoCards: Story = { render: () => <TwoCardsRender /> };

// ── Story: three cards — root with two nested objects ─────────────────────────

const ThreeCardsRender = () => (
  <GraphCanvas height="100vh" defaultPan={{ x: 60, y: 60 }}>

    <GraphCard id="order" x={0} y={0}>
      <JsonCardTitle>Order</JsonCardTitle>
      <JsonFieldRow label="order_id" value="ORD-9921" />
      <JsonFieldRow label="status"   value="processing" />
      <JsonObjectRow label="Customer">
        <GraphHandle id="customer-out" side="right" />
      </JsonObjectRow>
      <JsonObjectRow label="Shipping">
        <GraphHandle id="shipping-out" side="right" />
      </JsonObjectRow>
    </GraphCard>

    <GraphCard id="customer" x={400} y={0}>
      <JsonCardTitle>
        <JsonInputHandle id="in" />
        Customer
      </JsonCardTitle>
      <JsonFieldRow label="name"  value="Alex Rivera" />
      <JsonFieldRow label="email" value="alex@example.com" />
      <JsonFieldRow label="tier"  value="premium" />
    </GraphCard>

    <GraphCard id="shipping" x={400} y={210}>
      <JsonCardTitle>
        <JsonInputHandle id="in" />
        Shipping
      </JsonCardTitle>
      <JsonFieldRow label="carrier"  value="UPS" />
      <JsonFieldRow label="tracking" value="1Z999AA1" />
      <JsonFieldRow label="eta"      value="2026-03-15" />
    </GraphCard>

    <GraphEdge
      from={{ node: "order",    handle: "customer-out" }}
      to={{ node: "customer", handle: "in" }}
    />
    <GraphEdge
      from={{ node: "order",    handle: "shipping-out" }}
      to={{ node: "shipping", handle: "in" }}
    />

  </GraphCanvas>
);

export const ThreeCards: Story = { render: () => <ThreeCardsRender /> };
