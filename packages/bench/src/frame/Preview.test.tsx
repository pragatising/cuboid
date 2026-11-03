import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Preview } from "./Preview";
import type { FrameWindow, Shown } from "./protocol";

afterEach(cleanup);

const content = (tag: string): Shown => ({ node: { tag }, sources: new Map() });

describe("a preview", () => {
  it("tells the page what to draw once the page has loaded, and again when that changes or the page loads again", () => {
    const show = vi.fn();
    const { rerender } = render(<Preview title="Example" content={content("Button")} />);
    const frame = screen.getByTitle("Example") as HTMLIFrameElement;
    (frame.contentWindow as FrameWindow).Bench = { show, edit: () => undefined };
    expect(show).not.toHaveBeenCalled();
    fireEvent.load(frame);
    expect(show).toHaveBeenLastCalledWith(expect.objectContaining({ node: { tag: "Button" } }));
    rerender(<Preview title="Example" content={content("Link")} />);
    expect(show).toHaveBeenLastCalledWith(expect.objectContaining({ node: { tag: "Link" } }));
    const calls = show.mock.calls.length;
    fireEvent.load(frame);
    expect(show.mock.calls.length).toBe(calls + 1);
  });

  it("sends what the pane changed on instances to the page, each by where its element is written, again as it changes, without drawing the example again", () => {
    const show = vi.fn();
    const edit = vi.fn();
    const authored: Shown = { authored: { component: "Table", example: "Default" } };
    const { rerender } = render(<Preview title="Example" content={authored} edits={{ "5:7": { density: "dense" } }} />);
    const frame = screen.getByTitle("Example") as HTMLIFrameElement;
    (frame.contentWindow as FrameWindow).Bench = { show, edit };
    fireEvent.load(frame);
    expect(edit).toHaveBeenLastCalledWith({ "5:7": { density: "dense" } });
    const shown = show.mock.calls.length;
    rerender(<Preview title="Example" content={authored} edits={{ "5:7": { density: "dense" }, "6:7": { selected: true } }} />);
    expect(edit).toHaveBeenLastCalledWith({ "5:7": { density: "dense" }, "6:7": { selected: true } });
    expect(show.mock.calls.length).toBe(shown);
  });

  it("puts the example back as written when nothing is changed", () => {
    const edit = vi.fn();
    render(<Preview title="Example" content={{ authored: { component: "Table", example: "Default" } }} />);
    const frame = screen.getByTitle("Example") as HTMLIFrameElement;
    (frame.contentWindow as FrameWindow).Bench = { show: () => undefined, edit };
    fireEvent.load(frame);
    expect(edit).toHaveBeenLastCalledWith({});
  });
});
