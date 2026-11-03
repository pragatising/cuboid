import { OutlineTree } from "@sragatiping/cuboid";

export function Default() {
  return (
    <OutlineTree
      items={[
        { title: "Understand how portfolios are doing", children: [{ title: "Show approval and review rates", children: [{ title: "By rule" }, { title: "By week" }] }, { title: "Say what changed since last month" }] },
        { title: "Act on a rule", children: [{ title: "Show what a change would have done" }] },
        { title: "Measure what happened" },
      ]}
    />
  );
}

export function LongTitles() {
  return (
    <div style={{ width: 360 }}>
      <OutlineTree
        items={[
          {
            title: "A rule that sends applications to manual review should be judged by what reviewers do with them, not by how many it sends",
            children: [{ title: "Reviewers approve most of what is sent, which says the rule is cautious and the work behind it is mostly spent confirming" }, { title: "Short" }, { title: "Another long item that wraps onto a second and a third line of text" }],
          },
          { title: "Next" },
        ]}
      />
    </div>
  );
}

export function Composed() {
  return (
    <OutlineTree>
      <OutlineTree.Item>
        <OutlineTree.Title>Plan</OutlineTree.Title>
        <OutlineTree>
          <OutlineTree.Item>
            <OutlineTree.Title>Write the brief</OutlineTree.Title>
          </OutlineTree.Item>
        </OutlineTree>
      </OutlineTree.Item>
      <OutlineTree.Item>
        <OutlineTree.Title>
          Build with <strong>bold</strong> and <em>italic</em> text
        </OutlineTree.Title>
      </OutlineTree.Item>
    </OutlineTree>
  );
}

export function DeepAndWide() {
  const leaf = (title: string) => ({ title });
  return (
    <OutlineTree
      items={[
        { title: "One", children: [{ title: "a", children: [{ title: "a.1", children: [leaf("a.1.1"), leaf("a.1.2")] }, leaf("a.2")] }, { title: "b", children: [{ title: "deeper", children: [{ title: "deepest", children: [leaf("past four levels")] }] }] }] },
        ...Array.from({ length: 4 }, (_, index) => ({ title: `Item ${index + 2}` })),
      ]}
    />
  );
}
