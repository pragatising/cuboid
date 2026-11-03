import { afterEach, describe, expect, it, vi } from "vitest";
import { forwardEmptyPress, forwardGestures } from "./forward";

const made = () => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  return frame;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("what a frame hands to the canvas it is on", () => {
  it("is the wheel, with ctrl and the deltas it had, and the page's own scroll and zoom left undone", () => {
    const frame = made();
    forwardGestures(frame);
    const heard = vi.fn();
    document.addEventListener("wheel", heard);
    const wheel = new WheelEvent("wheel", { deltaY: 40, deltaX: 3, ctrlKey: true, clientX: 10, clientY: 20, bubbles: true, cancelable: true });
    frame.contentDocument!.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    const seen = heard.mock.calls[0][0] as WheelEvent;
    expect([seen.deltaX, seen.deltaY, seen.ctrlKey]).toEqual([3, 40, true]);
    expect(seen.target).toBe(frame);
  });

  it("is Space, pressed and let go, but not Space typed into a field", () => {
    const frame = made();
    forwardGestures(frame);
    const heard = vi.fn();
    document.addEventListener("keydown", heard);
    document.addEventListener("keyup", heard);
    const page = frame.contentDocument!;
    const input = page.createElement("input");
    page.body.append(input);
    input.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true }));
    expect(heard).not.toHaveBeenCalled();
    page.body.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true, cancelable: true }));
    page.body.dispatchEvent(new KeyboardEvent("keyup", { code: "Space", key: " ", bubbles: true }));
    expect(heard.mock.calls.map(([event]) => event.type)).toEqual(["keydown", "keyup"]);
    page.body.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA", key: "a", bubbles: true }));
    expect(heard).toHaveBeenCalledTimes(2);
  });

  it("stops when it is taken back", () => {
    const frame = made();
    const stop = forwardGestures(frame);
    const heard = vi.fn();
    document.addEventListener("wheel", heard);
    stop();
    frame.contentDocument!.dispatchEvent(new WheelEvent("wheel", { bubbles: true }));
    expect(heard).not.toHaveBeenCalled();
  });
});

describe("a press on a frame's page", () => {
  const press = (target: Element) => target.dispatchEvent(new Event("pointerdown", { bubbles: true }));

  it("is the frame's when it lands on the page's background, and not when it lands on what is drawn", () => {
    const frame = made();
    const onPress = vi.fn();
    forwardEmptyPress(frame, onPress);
    const page = frame.contentDocument!;
    const root = page.createElement("div");
    root.id = "root";
    const drawn = page.createElement("button");
    root.append(drawn);
    page.body.append(root);

    press(drawn);
    expect(onPress).not.toHaveBeenCalled();
    press(root);
    press(page.body);
    press(page.documentElement);
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it("stops being heard once taken back", () => {
    const frame = made();
    const onPress = vi.fn();
    forwardEmptyPress(frame, onPress)();
    press(frame.contentDocument!.body);
    expect(onPress).not.toHaveBeenCalled();
  });
});
