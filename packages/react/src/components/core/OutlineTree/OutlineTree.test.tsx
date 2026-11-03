import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { OutlineTree } from "./OutlineTree";

behavesAsComponent({ Component: OutlineTree, dataComponent: "OutlineTree", props: { items: [{ title: "One" }] } });
behavesAsComponent({ Component: OutlineTree.Item, dataComponent: "OutlineTree.Item", props: { children: "One" } });
behavesAsComponent({ Component: OutlineTree.Title, dataComponent: "OutlineTree.Title", props: { children: "One" } });

const items = [
  { title: "One", children: [{ title: "a", children: [{ title: "a.1" }] }, { title: "b" }] },
  { title: "Two" },
];

describe("OutlineTree", () => {
  it("draws items as data: a list, an item for each, the title first and the nested tree after it", () => {
    const { container } = render(<OutlineTree items={items} />);
    const roots = container.querySelectorAll(':scope > [data-component="OutlineTree"] > [data-component="OutlineTree.Item"]');
    expect(roots).toHaveLength(2);
    const [first] = roots;
    expect(first.children[0]).toHaveAttribute("data-component", "OutlineTree.Title");
    expect(first.children[0]).toHaveTextContent("One");
    expect(first.children[1]).toHaveAttribute("data-component", "OutlineTree");
    expect(first.querySelectorAll('[data-component="OutlineTree.Item"]')).toHaveLength(3);
    expect(roots[1].children).toHaveLength(1);
  });

  it("draws the same tree from its parts", () => {
    const { container } = render(
      <OutlineTree>
        <OutlineTree.Item>
          <OutlineTree.Title>One</OutlineTree.Title>
          <OutlineTree>
            <OutlineTree.Item>
              <OutlineTree.Title>a</OutlineTree.Title>
            </OutlineTree.Item>
          </OutlineTree>
        </OutlineTree.Item>
      </OutlineTree>,
    );
    expect(container.querySelectorAll("ol")).toHaveLength(2);
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("takes plain text as an item's title, and keeps the outline after it", () => {
    const { container } = render(
      <OutlineTree>
        <OutlineTree.Item>
          One
          <OutlineTree>
            <OutlineTree.Item>a</OutlineTree.Item>
          </OutlineTree>
        </OutlineTree.Item>
      </OutlineTree>,
    );
    const [first] = container.querySelectorAll("li");
    expect(first.children[0]).toHaveAttribute("data-component", "OutlineTree.Title");
    expect(first.children[0]).toHaveTextContent("One");
    expect(first.children[1]).toHaveAttribute("data-component", "OutlineTree");
    expect(container.querySelectorAll("li")[1].children[0]).toHaveTextContent("a");
  });

  it("takes rich titles, and passes props to the list", () => {
    const { container } = render(<OutlineTree aria-label="Plan" items={[{ title: <strong>Bold</strong> }]} />);
    expect(container.querySelector("ol")).toHaveAttribute("aria-label", "Plan");
    expect(container.querySelector("strong")).toHaveTextContent("Bold");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<OutlineTree aria-label="Plan" items={items} />);
    await expectNoAxeViolations(container);
  });
});
