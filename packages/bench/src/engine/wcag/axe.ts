import axe from "axe-core";
import type { Issue } from "../content/issue";
import { fromAxe } from "./fromAxe";
import type { AxeResults } from "./fromAxe";

/** The rules held to WCAG 2.0, 2.1 and 2.2 at A and AA, and best practice (reported as a warning, not an error). */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** axe runs one audit at a time and refuses a second while one is going, so audits wait their turn. */
let turn: Promise<unknown> = Promise.resolve();

/**
 * Runs axe over an element and reports what it finds as issues. `path` is where the composition is (`Button`).
 * Contrast needs the browser's layout and paint: with `contrast: false` (a jsdom test) that rule is left out rather than guessed at.
 */
export function runAxe(element: Element, path: string[], options: { contrast?: boolean } = {}): Promise<Issue[]> {
  const next = turn.then(() => audit(element, path, options));
  turn = next.catch(() => undefined);
  return next;
}

async function audit(element: Element, path: string[], options: { contrast?: boolean }): Promise<Issue[]> {
  const results = await axe.run(element, {
    runOnly: { type: "tag", values: TAGS },
    // An example is a piece of a page, not a page: how landmarks are arranged and named across a page is for the page to answer.
    rules: {
      region: { enabled: false },
      "landmark-main-is-top-level": { enabled: false },
      "landmark-no-duplicate-main": { enabled: false },
      "landmark-unique": { enabled: false },
      "color-contrast": { enabled: options.contrast !== false },
    },
  });
  return fromAxe(results as unknown as AxeResults, path);
}
