import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTypeAhead } from "./useTypeAhead";
import type { TypeAheadOptions } from "./useTypeAhead";

const NAMES = ["Apple", "Avocado", "Banana", "Blueberry", "Cherry"];

// A list where the "current" item is whichever has data-current, and a keydown asks the hook for the next match.
function Harness({ options, onMatch }: { options?: TypeAheadOptions; onMatch: (name: string | undefined, typing: boolean) => void }) {
  const { match, typing } = useTypeAhead(options);
  return (
    <div
      tabIndex={0}
      data-testid="list"
      onKeyDown={(event) => {
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("li"));
        const index = items.findIndex((item) => item.hasAttribute("data-current"));
        onMatch(match(event, items, index)?.textContent ?? undefined, typing());
      }}
    >
      <ul>
        {NAMES.map((name, i) => (
          <li key={name} {...(i === 0 ? { "data-current": "" } : {})}>
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

const press = (key: string, init: object = {}) => fireEvent.keyDown(screen.getByTestId("list"), { key, ...init });

describe("useTypeAhead", () => {
  it("finds the next item that starts with the typed character, after the current one", () => {
    const onMatch = vi.fn();
    render(<Harness onMatch={onMatch} />);
    press("b");
    expect(onMatch).toHaveBeenLastCalledWith("Banana", true);
  });

  it("a longer prefix refines the match from the current item", () => {
    const onMatch = vi.fn();
    render(<Harness onMatch={onMatch} />);
    press("b");
    press("l");
    expect(onMatch).toHaveBeenLastCalledWith("Blueberry", true);
  });

  it("wraps around to find a match before the current item", () => {
    const onMatch = vi.fn();
    render(<Harness onMatch={onMatch} />);
    press("a");
    expect(onMatch).toHaveBeenLastCalledWith("Avocado", true);
  });

  it("returns nothing, and does not claim a word, for keys that are not typeahead keys", () => {
    const onMatch = vi.fn();
    render(<Harness onMatch={onMatch} />);
    press("ArrowDown");
    press("b", { ctrlKey: true });
    press(" ");
    expect(onMatch.mock.calls.map((call) => call[0])).toEqual([undefined, undefined, undefined]);
    expect(onMatch).toHaveBeenLastCalledWith(undefined, false);
  });

  it("a space is part of the word once one has begun", () => {
    const onMatch = vi.fn();
    render(<Harness options={{ getText: (item) => (item.textContent === "Blueberry" ? "blue berry" : (item.textContent ?? "")) }} onMatch={onMatch} />);
    press("b");
    press("l");
    press("u");
    press("e");
    press(" ");
    expect(onMatch).toHaveBeenLastCalledWith("Blueberry", true);
  });

  it("matches the text getText gives, not the textContent", () => {
    const onMatch = vi.fn();
    render(<Harness options={{ getText: (item) => `x${item.textContent}` }} onMatch={onMatch} />);
    press("x");
    expect(onMatch).toHaveBeenLastCalledWith("Avocado", true);
  });

  it("a pause ends the word", async () => {
    const onMatch = vi.fn();
    render(<Harness options={{ resetMs: 30 }} onMatch={onMatch} />);
    press("b");
    await new Promise((resolve) => setTimeout(resolve, 60));
    press(" ");
    expect(onMatch).toHaveBeenLastCalledWith(undefined, false);
  });
});
