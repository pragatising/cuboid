import { describe, expect, it } from "vitest";
import { mergeProps } from "./mergeProps";

describe("mergeProps (component props first, consumer props second)", () => {
  it("joins class names", () => {
    expect(mergeProps({ className: "a" }, { className: "b" }).className).toBe("a b");
    expect(mergeProps({ className: "a" }, { className: undefined }).className).toBe("a");
  });

  it("merges styles with the consumer's winning on conflict", () => {
    const style = mergeProps({ style: { color: "red", height: 1 } }, { style: { color: "blue" } }).style;
    expect(style).toEqual({ color: "blue", height: 1 });
  });

  it("runs the component's handler first, then the consumer's, unless the event was prevented", () => {
    const calls: string[] = [];
    const merged = mergeProps({ onClick: () => calls.push("own") }, { onClick: () => calls.push("consumer") });
    merged.onClick({});
    expect(calls).toEqual(["own", "consumer"]);

    calls.length = 0;
    merged.onClick({ defaultPrevented: true });
    expect(calls).toEqual(["own"]);
  });

  it("lets the consumer's value win for any other attribute, and keeps non-overlapping keys from both", () => {
    const merged = mergeProps({ "data-component": "X", id: "a" }, { "data-component": "Y", title: "t" });
    expect(merged).toEqual({ "data-component": "Y", id: "a", title: "t" });
  });

  it("does not mutate its inputs", () => {
    const a = { className: "a", style: { color: "red" } };
    const b = { className: "b", style: { color: "blue" } };
    mergeProps(a, b);
    expect(a).toEqual({ className: "a", style: { color: "red" } });
    expect(b).toEqual({ className: "b", style: { color: "blue" } });
  });
});
