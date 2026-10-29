// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { namesIn, readStatuses } from "./status";

describe("which components a tracker row names", () => {
  it("takes several to a row, and drops the notes in brackets", () => {
    expect(namesIn("InputField, InputText, TextArea")).toEqual(["InputField", "InputText", "TextArea"]);
    expect(namesIn("Header (was SiteHeader)")).toEqual(["Header"]);
    expect(namesIn("CodeBlock (+ CodeSurface, syntax)")).toEqual(["CodeBlock"]);
    expect(namesIn("ActionList (internal)")).toEqual(["ActionList"]);
  });
});

describe("what the tracker says", () => {
  const table = [
    "| Component | Tier | Status | Notes |",
    "|---|---|---|---|",
    "| Button | state-heavy | Done | 2026-10-19. |",
    "| InlineCodeSnippet | simple | **On hold** | Held. |",
    "| Stack | layout | **Deleted** | Decided. |",
    "",
    "| Component | Status | Notes |",
    "|---|---|---|",
    "| CodeBlock (+ CodeSurface) | Seam done | New. |",
    "| Thing | Todo | |",
    "| Artifact | Rule | Notes |",
    "| `Component.test.tsx` | **Required** | x |",
  ].join("\n");

  it("reads the status of each component, in tables whose columns differ", () => {
    expect(readStatuses(table)).toEqual({ Button: "Done", InlineCodeSnippet: "On hold", Stack: "Deleted", CodeBlock: "Seam done", Thing: "Todo" });
  });

  it("reads the real tracker: every component has a status the shell knows", () => {
    const real = readStatuses(fs.readFileSync(path.resolve(__dirname, "../../../../../docs/backlog/react-migration-tracker.md"), "utf8"));
    expect(Object.keys(real).length).toBeGreaterThan(30);
    expect(real.Button).toBe("Done");
    expect(real.TileIcon).toBe("Done");
    expect(real.Header).toBe("Done");
    expect(real.ApiResponseViewer).toBe("Seam done");
  });
});
