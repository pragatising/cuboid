import { isControlEvent } from "./controls";

const click = (target: Element) => {
  const event = new MouseEvent("mousedown", { bubbles: true });
  target.dispatchEvent(event);
  return { event };
};

describe("an event from a control in a block's view", () => {
  it("is left alone whatever part of the control was hit: the button, its label or its icon", () => {
    const view = document.createElement("div");
    view.innerHTML = '<button type="button"><span class="icon"></span><span class="label">Add Image</span></button>';
    document.body.append(view);
    for (const target of [view.querySelector("button")!, view.querySelector(".icon")!, view.querySelector(".label")!]) expect(isControlEvent(click(target))).toBe(true);
    view.remove();
  });

  it("covers fields, links and resize handles too", () => {
    const view = document.createElement("div");
    view.innerHTML = '<input /><textarea></textarea><a href="/x"><span>x</span></a><div role="separator"></div><div role="slider"></div>';
    document.body.append(view);
    for (const target of [...view.querySelectorAll("input, textarea, a span, [role=separator], [role=slider]")]) expect(isControlEvent(click(target))).toBe(true);
    view.remove();
  });

  it("is not an event from the picture or the block itself, which selects the block as it should", () => {
    const view = document.createElement("div");
    view.innerHTML = '<figure><img alt="" /></figure>';
    document.body.append(view);
    expect(isControlEvent(click(view.querySelector("img")!))).toBe(false);
    expect(isControlEvent(click(view.querySelector("figure")!))).toBe(false);
    view.remove();
  });
});
