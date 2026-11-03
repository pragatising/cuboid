import { describe, expect, it } from "vitest";
import { INTERACTIONS, forceableIds, ids, userInteractionIds } from "./interactions";
import type { InteractionDef } from "./interactions";

const defs = ids.map((id) => [id, INTERACTIONS[id] as InteractionDef] as const);

describe("the interaction registry", () => {
  it("names every entry, with a plain summary and at least one physical input", () => {
    for (const [id, def] of defs) {
      expect(def.label, id).toBeTruthy();
      expect(def.summary.endsWith("."), id).toBe(true);
      expect(def.inputs.length, id).toBeGreaterThan(0);
      expect(def.channels.length, id).toBeGreaterThan(0);
    }
  });

  it("keeps labels unique, since a badge is read by its label", () => {
    const labels = defs.map(([, def]) => def.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("can only force an interaction that has a pseudo-class", () => {
    for (const id of forceableIds) expect((INTERACTIONS[id] as InteractionDef).signals.pseudo?.length, id).toBeGreaterThan(0);
  });

  it("separates what people do from what happens to a component", () => {
    expect(userInteractionIds).toContain("hover");
    expect(userInteractionIds).not.toContain("load");
    expect(forceableIds.every((id) => INTERACTIONS[id].cause === "user")).toBe(true);
  });
});
