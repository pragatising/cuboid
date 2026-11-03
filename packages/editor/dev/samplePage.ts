import type { LegacyBlock } from "../src";

/** A page as the portfolio's old editor stored it, so the new editor can be tried on real-shaped content. */
export const OLD_PAGE: LegacyBlock[] = [
  { tag: "h", variant: "1", props: {}, children: "Policy Optimization" },
  { tag: "p", props: {}, children: "{date:2026-08-01}Aug 1, 2026{/date}" },
  { tag: "callout", props: { background: "highlight.blue" }, children: "This project is **the first project where I built the entire front-end**. 1 back-end engineer, I as designer as well as front-end engineer." },
  { tag: "h", variant: "2", props: {}, children: "Background" },
  { tag: "p", props: { color: "text.muted" }, children: "Lenders route applications through policy rules. {bg:highlight.red}Many mid-sized clients keep manual review volume high because they don't fully trust automation.{/bg}" },
  {
    tag: "callout",
    props: {},
    children: JSON.stringify({
      blocks: [
        { tag: "p", props: {}, children: "**Persona**" },
        { tag: "p", props: {}, children: "Imagine **Donna** is a credit union program manager for loans." },
        { tag: "list", variant: "bullet", props: {}, children: JSON.stringify({ items: [{ title: "Policy is set once and has no feedback loop", kind: "item", children: [] }, { title: "She can't tell which rules generate review work", kind: "item", children: [] }] }) },
      ],
    }),
  },
  {
    tag: "box",
    variant: "2",
    props: {},
    children: JSON.stringify({
      columns: [
        { width: 1, blocks: [{ tag: "h", variant: "3", props: {}, children: "Begin with portfolio health" }, { tag: "p", props: {}, children: "Help users first understand how they are doing, what the approval rate is." }] },
        { width: 2, blocks: [{ tag: "img", props: { src: "r2://dashboard.png", alt: "Dashboard" }, children: "" }] },
      ],
    }),
  },
  { tag: "divider", props: {}, children: "" },
  { tag: "p", props: {}, children: "Status {pill:green-bold-f}Shipped{/pill}. Press `/` to add blocks, and select text to format it." },
];
