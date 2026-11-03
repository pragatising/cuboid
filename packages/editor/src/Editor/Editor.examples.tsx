import { SmartCard } from "@sragatiping/cuboid";
import type { SmartLinkClient } from "@sragatiping/cuboid";
import { Editor } from "@sragatiping/cuboid-editor";
import type { DocNode } from "@sragatiping/cuboid-editor";

const text = (value: string, marks?: { type: string }[]): DocNode => ({ type: "text", text: value, ...(marks ? { marks } : {}) });
const paragraph = (...content: DocNode[]): DocNode => ({ type: "paragraph", content });

const item = (title: string, ...tree: DocNode[]): DocNode => ({ type: "outlineItem", content: [paragraph(text(title)), ...tree] });

/** An item with a chip as its title and a line of description under it, as the portfolio's outline has. */
const described = (title: string, description: string): DocNode => ({
  type: "outlineItem",
  content: [paragraph(text(title, [{ type: "chip" }]), { type: "hardBreak" }, text(description))],
});

const page: DocNode = {
  type: "doc",
  content: [
    paragraph(text("A rule that sends applications to manual review should be judged by what reviewers do with them. Press / to add blocks, and select text to format it.")),
    { type: "callout", attrs: { color: "blue", bordered: false }, content: [paragraph(text("This project is "), text("the first where I built the whole front end", [{ type: "bold" }]), text("."))] },
    { type: "heading", attrs: { level: 2 }, content: [text("Background")] },
    paragraph(text("Lenders route applications through policy rules: auto-approve, auto-decline, or manual review. Many mid-sized clients keep manual review volume high because they do not fully trust automation.")),
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [paragraph(text("Policy is set once and has no feedback loop"))] },
        { type: "listItem", content: [paragraph(text("Nobody can tell which rules generate review work"))] },
      ],
    },
    {
      type: "columns",
      content: [
        { type: "column", attrs: { flex: 1 }, content: [{ type: "heading", attrs: { level: 3 }, content: [text("Begin with portfolio health")] }, paragraph(text("Help users first understand how they are doing."))] },
        { type: "column", attrs: { flex: 1 }, content: [{ type: "heading", attrs: { level: 3 }, content: [text("Then act on a rule")] }, paragraph(text("Show what a change would have done before it is made."))] },
      ],
    },
    {
      type: "outlineTree",
      content: [
        item("Construct The World From Third Person POV", {
          type: "outlineTree",
          content: [
            described("Identify Building Blocks", "actors, tools, physical environment, digital environment, and their relationship with each other"),
            described("Nature of interconnections", "relationships between each of the elements as cause and effect."),
            described("System Goals", "this could be business goals, process goals"),
          ],
        }),
        item("Change POV to That of People / Users / Actors", { type: "outlineTree", content: [described("Cultural & Social Aspects", "that people embody as a result of their lived experiences")] }),
      ],
    },
    { type: "codeBlock", attrs: { language: "javascript" }, content: [text("const rate = approved / applications;")] },
    { type: "divider" },
    paragraph(text("A page is the JSON it keeps, drawn the same way whether it is written or read.")),
  ],
};

export function Editing() {
  return (
    <div style={{ width: 520 }}>
      <Editor defaultTitle="Policy Optimization" defaultValue={page} onChange={(doc: DocNode) => console.log(doc)} />
    </div>
  );
}

export function ViewOnly() {
  return (
    <div style={{ width: 520 }}>
      <Editor readOnly defaultTitle="Policy Optimization" defaultValue={page} />
    </div>
  );
}

/** What a host knows about its own links: it says what a design file or a story is called, and the editor only keeps the address. */
const briefs: SmartLinkClient = {
  resolve: async (url) =>
    url.includes("/brief")
      ? { url, title: "Policy optimization brief", provider: "Docs", snippet: "Why a rule that sends applications to manual review should be judged by what reviewers do with them.", embedUrl: url }
      : null,
};

const linkPage: DocNode = {
  type: "doc",
  content: [
    paragraph(text("Paste a link on an empty line, or press / and choose Link. Select a link block to change how it looks.")),
    { type: "smartLink", attrs: { url: "https://example.com/brief", appearance: "block", height: "" } },
    paragraph(text("The same link, as a frame:")),
    { type: "smartLink", attrs: { url: "https://example.com/brief", appearance: "embed", height: "sm" } },
  ],
};

export function WithLinks() {
  return (
    <div style={{ width: 520 }}>
      <SmartCard.Provider client={briefs}>
        <Editor defaultTitle="Links" defaultValue={linkPage} />
      </SmartCard.Provider>
    </div>
  );
}
