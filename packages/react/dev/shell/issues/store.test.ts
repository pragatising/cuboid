import { describe, expect, it } from "vitest";
import { ago, forgetChecks, loadChecks, saveCheck } from "./store";
import type { Checked } from "./check";

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) };
};
const answer = (examples: number): Checked => ({ examples, issues: [], at: 1000 });

describe("saved checks", () => {
  it("are got back while the source is the same", () => {
    const storage = memory();
    saveCheck(storage, "abc", "Button", answer(5));
    saveCheck(storage, "abc", "Pill", answer(11));
    expect(loadChecks(storage, "abc")).toEqual({ Button: answer(5), Pill: answer(11) });
  });

  it("are not used once the source has changed, and the next save starts afresh", () => {
    const storage = memory();
    saveCheck(storage, "abc", "Button", answer(5));
    expect(loadChecks(storage, "def")).toEqual({});
    saveCheck(storage, "def", "Pill", answer(11));
    expect(loadChecks(storage, "def")).toEqual({ Pill: answer(11) });
    expect(loadChecks(storage, "abc")).toEqual({});
  });

  it("can be forgotten", () => {
    const storage = memory();
    saveCheck(storage, "abc", "Button", answer(5));
    forgetChecks(storage);
    expect(loadChecks(storage, "abc")).toEqual({});
  });

  it("are a cache: storage that is missing, broken or full costs nothing", () => {
    expect(loadChecks(undefined, "abc")).toEqual({});
    expect(loadChecks({ getItem: () => "{not json" }, "abc")).toEqual({});
    expect(() => saveCheck({ getItem: () => null, setItem: () => { throw new Error("quota"); } }, "abc", "Button", answer(1))).not.toThrow();
    expect(() => saveCheck(undefined, "abc", "Button", answer(1))).not.toThrow();
  });
});

describe("how long ago", () => {
  const now = 10_000_000;
  it("says it for a person", () => {
    expect(ago(now - 10_000, now)).toBe("just now");
    expect(ago(now - 5 * 60_000, now)).toBe("5 min ago");
    expect(ago(now - 3 * 3_600_000, now)).toBe("3 h ago");
    expect(ago(now - 2 * 86_400_000, now)).toBe("2 d ago");
  });
});
