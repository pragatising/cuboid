import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import deviceProfileReport from "../CodeSnippet/__fixtures__/device-profile-report";
import { GraphCanvas } from "../Graph/GraphCanvas";
import { GraphCard } from "../Graph/GraphCard";
import { GraphHandle } from "../Graph/GraphHandle";
import { GraphEdge } from "../Graph/GraphEdge";
import { JsonCardTitle, JsonFieldRow, JsonObjectRow, JsonInputHandle } from "./index";
import { topAnchoredLayout } from "./treeLayout";

/**
 * Real-world graph built from the fictional NexusGuard device-profile report.
 *
 * Card positions are computed by `treeLayout` — no manual coordinate maths here.
 * Each `rowCount` is: 1 title + number of field rows + number of object rows.
 */
const meta: Meta = {
  title: "JsonGraph/DeviceProfileReport",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const r    = deviceProfileReport;
const d    = r.data;
const k    = r.keyAttributes;
const bat  = d.battery_status;
const ng   = d.ng_variables;
const pol  = d.policy_details_api.policy_detail_api[0];
const name = k.reportedNames[0];

// ── Declare tree structure ────────────────────────────────────────────────────
// rowCount = 1 (title) + field rows + object rows
//
// handleRowIndex = 0-based row position of the object row inside the parent
// card that links to that child (title = 0, first field = 1, …).

const pos = topAnchoredLayout([
  {
    id: "root", rowCount: 1 + 5 + 2,
    children: [
      { id: "data", handleRowIndex: 6 }, // after title + 5 fields
      { id: "key",  handleRowIndex: 7 },
    ],
  },
  {
    id: "data", rowCount: 1 + 9 + 3,
    children: [
      { id: "battery", handleRowIndex: 10 }, // after title + 9 fields
      { id: "ng",      handleRowIndex: 11 },
      { id: "policy",  handleRowIndex: 12 },
    ],
  },
  {
    id: "key", rowCount: 1 + 7 + 1,
    children: [
      { id: "names", handleRowIndex: 8 }, // after title + 7 fields
    ],
  },
  { id: "battery", rowCount: 1 + 2 },
  { id: "ng",      rowCount: 1 + 7 },
  { id: "policy",  rowCount: 1 + 4 },
  { id: "names",   rowCount: 1 + 4 },
], "root");

const at = (id: string) => pos.get(id)!;

// ── Story ─────────────────────────────────────────────────────────────────────

const Render = () => (
  <GraphCanvas height="100vh" defaultPan={{ x: 60, y: 40 }} defaultZoom={0.85}>

    {/* Col 0 */}
    <GraphCard id="root" x={at("root").x} y={at("root").y}>
      <JsonCardTitle>Report</JsonCardTitle>
      <JsonFieldRow label="entity"  value={r.entityName} />
      <JsonFieldRow label="status"  value={r.status} />
      <JsonFieldRow label="active"  value={String(r.active)} />
      <JsonFieldRow label="created" value={r.createdOn} />
      <JsonFieldRow label="expires" value={r.expiresDn} />
      <JsonObjectRow label="data">
        <GraphHandle id="data-out" side="right" />
      </JsonObjectRow>
      <JsonObjectRow label="keyAttributes">
        <GraphHandle id="key-out" side="right" />
      </JsonObjectRow>
    </GraphCard>

    {/* Col 1 */}
    <GraphCard id="data" x={at("data").x} y={at("data").y}>
      <JsonCardTitle>
        <JsonInputHandle id="in" />
        Device Data
      </JsonCardTitle>
      <JsonFieldRow label="os"           value={d.os} />
      <JsonFieldRow label="browser"      value={d.browser} />
      <JsonFieldRow label="risk_rating"  value={d.risk_rating} />
      <JsonFieldRow label="device_score" value={String(d.device_score)} />
      <JsonFieldRow label="true_ip"      value={d.true_ip} />
      <JsonFieldRow label="device_id"    value={d.device_id} />
      <JsonFieldRow label="proxy_type"   value={d.proxy_type} />
      <JsonFieldRow label="event_type"   value={d.event_type} />
      <JsonFieldRow label="vm_rating"    value={d.vm_rating} />
      <JsonObjectRow label="battery_status">
        <GraphHandle id="battery-out" side="right" />
      </JsonObjectRow>
      <JsonObjectRow label="ng_variables">
        <GraphHandle id="ng-out" side="right" />
      </JsonObjectRow>
      <JsonObjectRow label="policy_details_api">
        <GraphHandle id="policy-out" side="right" />
      </JsonObjectRow>
    </GraphCard>

    <GraphCard id="key" x={at("key").x} y={at("key").y}>
      <JsonCardTitle>
        <JsonInputHandle id="in" />
        Key Attributes
      </JsonCardTitle>
      <JsonFieldRow label="bureauName"   value={k.bureauName} />
      <JsonFieldRow label="reportStatus" value={k.reportStatus} />
      <JsonFieldRow label="market"       value={k.market} />
      <JsonFieldRow label="submarket"    value={k.submarket} />
      <JsonFieldRow label="disputed"     value={String(k.disputed)} />
      <JsonFieldRow label="initialFraud" value={String(k.initialFraud)} />
      <JsonFieldRow label="suppressed"   value={String(k.suppressed)} />
      <JsonObjectRow label="reportedNames">
        <GraphHandle id="names-out" side="right" />
      </JsonObjectRow>
    </GraphCard>

    {/* Col 2 */}
    <GraphCard id="battery" x={at("battery").x} y={at("battery").y}>
      <JsonCardTitle>
        <JsonInputHandle id="in" />
        Battery Status
      </JsonCardTitle>
      <JsonFieldRow label="level"  value={String(bat.level)} />
      <JsonFieldRow label="status" value={bat.status} />
    </GraphCard>

    <GraphCard id="ng" x={at("ng").x} y={at("ng").y}>
      <JsonCardTitle>
        <JsonInputHandle id="in" />
        NG Variables
      </JsonCardTitle>
      <JsonFieldRow label="_cc_per_exactid_hour"        value={ng._cc_per_exactid_hour} />
      <JsonFieldRow label="_cc_per_smartid_hour"        value={ng._cc_per_smartid_hour} />
      <JsonFieldRow label="_exactid_gbl_velocity_hour"  value={ng._exactid_gbl_velocity_hour} />
      <JsonFieldRow label="_smartid_gbl_velocity_hour"  value={ng._smartid_gbl_velocity_hour} />
      <JsonFieldRow label="_accemail_gbl_velocity_hour" value={ng._accemail_gbl_velocity_hour} />
      <JsonFieldRow label="_accphone_gbl_velocity_hour" value={ng._accphone_gbl_velocity_hour} />
      <JsonFieldRow label="customerneverprofiledlocal"  value={ng.customerneverprofiledlocal} />
    </GraphCard>

    <GraphCard id="policy" x={at("policy").x} y={at("policy").y}>
      <JsonCardTitle>
        <JsonInputHandle id="in" />
        Policy Details
      </JsonCardTitle>
      <JsonFieldRow label="type"   value={pol.type} />
      <JsonFieldRow label="pvid"   value={pol.customer.pvid} />
      <JsonFieldRow label="var[0]" value={pol.customer.vars[0].variable ?? ""} />
      <JsonFieldRow label="var[1]" value={pol.customer.vars[1].variable ?? ""} />
    </GraphCard>

    <GraphCard id="names" x={at("names").x} y={at("names").y}>
      <JsonCardTitle>
        <JsonInputHandle id="in" />
        Reported Name
      </JsonCardTitle>
      <JsonFieldRow label="first"  value={name.person.first} />
      <JsonFieldRow label="middle" value={name.person.middle} />
      <JsonFieldRow label="last"   value={name.person.last} />
      <JsonFieldRow label="source" value={name.source} />
    </GraphCard>

    {/* Edges */}
    <GraphEdge from={{ node: "root",   handle: "data-out"    }} to={{ node: "data",    handle: "in" }} />
    <GraphEdge from={{ node: "root",   handle: "key-out"     }} to={{ node: "key",     handle: "in" }} />
    <GraphEdge from={{ node: "data",   handle: "battery-out" }} to={{ node: "battery", handle: "in" }} />
    <GraphEdge from={{ node: "data",   handle: "ng-out"      }} to={{ node: "ng",      handle: "in" }} />
    <GraphEdge from={{ node: "data",   handle: "policy-out"  }} to={{ node: "policy",  handle: "in" }} />
    <GraphEdge from={{ node: "key",    handle: "names-out"   }} to={{ node: "names",   handle: "in" }} />

  </GraphCanvas>
);

export const DeviceProfileReport: Story = { render: () => <Render /> };
