import React, { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { drawsNothing } from "../../engine/content/drawn";
import type { Issue } from "../../engine/content/issue";
import { toElement } from "../../engine/render";
import { runAxe } from "../../engine/wcag/axe";
import type { Node } from "../../engine/types";
import { checkComposition } from "../../engine/content/check";
import { printExample } from "../../engine/print";
import { composeExamples, exported, models } from "../playground/compose";
import { ExampleBoundary } from "../playground/ExampleBoundary";
import { importFrom, resolve } from "../playground/host";
import sourceHash from "virtual:source-hash";
import classes from "./IssuesPanel.module.css";
import { forgetChecks, loadChecks, saveCheck } from "./store";

export type Found = Issue & { example: string };
/** What a check found, and when. */
export type Checked = { examples: number; issues: Found[]; at: number };

/** An issue's message without the selector axe adds at its end (`(#_r_1_)`), which differs from one example to the next. */
export const whatIt = (message: string) => message.replace(/ \([^()]*\)$/, "");

export type Group = { issue: Issue; examples: string[]; count: number };

const ORDER = { error: 0, warning: 1, info: 2 } as const;

/** The same finding in several examples is one finding, with the examples it was seen in; the most serious first. */
export function groupFindings(found: Found[]): Group[] {
  const groups = new Map<string, Group>();
  for (const issue of found) {
    const key = `${issue.rule}|${whatIt(issue.message)}`;
    const group = groups.get(key) ?? { issue, examples: [], count: 0 };
    group.count++;
    if (!group.examples.includes(issue.example))
      group.examples.push(issue.example);
    groups.set(key, group);
  }
  return [...groups.values()].sort(
    (a, b) =>
      ORDER[a.issue.severity] - ORDER[b.issue.severity] || b.count - a.count,
  );
}

const checks = new Map<string, Promise<Checked>>();

/**
 * Answers kept from before (in this browser, while the source is what it was when they were got): a check is as true as the code it
 * was run on, so asking again for code that has not changed is the same work for the same answer.
 */
const storage = typeof localStorage === "undefined" ? undefined : localStorage;
const kept = loadChecks(storage, sourceHash);

/**
 * Where examples are drawn to be checked. It is on screen, because axe leaves out what is off screen (it cannot say what colour
 * something is behind unless it can see it), so an off-screen audit would call everything's contrast fine. `CheckPreview` is that place:
 * a small card docked in a corner, shown while a check runs, with what is being checked in it.
 */
let host: HTMLElement | null = null;
let checking: string | null = null;
const listeners = new Set<() => void>();
const setChecking = (name: string | null) => {
  checking = name;
  listeners.forEach((listener) => listener());
};

export function CheckPreview() {
  const name = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    () => checking,
  );
  return (
    <div className={classes.Preview} hidden={name === null}>
      <span className={classes.PreviewLabel}>Checking {name}…</span>
      <div
        className={classes.PreviewStage}
        ref={(element) => {
          host = element;
        }}
      />
    </div>
  );
}

/**
 * Waits until a drawn example has stopped changing. A component can finish drawing itself after React's first commit (a tooltip that
 * mounts its tip, a popup that portals), and what it names or describes itself with may not exist until then, so auditing at once
 * can fail on what is a moment from being there. Two looks, a frame apart, that agree: it is done (or a second is up).
 */
async function settled(stage: Element) {
  const look = () => `${stage.innerHTML}|${document.body.childElementCount}`;
  let last = look();
  for (let waited = 0; waited < 1000; waited += 32) {
    await new Promise((done) => setTimeout(done, 32));
    const now = look();
    if (now === last) return;
    last = now;
  }
}

/** Checks go one at a time: they share one place on screen to be drawn in, and axe runs one audit at a time. */
let turn: Promise<unknown> = Promise.resolve();

/** What is drawn and checked: each example, as a node with where each element was written, and what HTML already said of it. */
type Plan = {
  drawn: {
    title: string;
    node: Node;
    sources: Map<Node, string>;
    issues: Issue[];
  }[];
  contentFromOptional: string[];
};

/**
 * Checks something against a plan, whether or not it is on screen: each is drawn in `CheckPreview`, audited by axe in this browser
 * (contrast too), and held to the HTML content model. The answer is kept under `key`, so asking again is free.
 */
function checkPlan(key: string, plan: () => Plan | null): Promise<Checked> {
  const known = checks.get(key);
  if (known) return known;
  if (kept[key]) {
    const saved = Promise.resolve(kept[key]);
    checks.set(key, saved);
    return saved;
  }
  const run = turn
    .then(() => check(key, plan()))
    .then((checked) => {
      saveCheck(storage, sourceHash, key, checked);
      return checked;
    });
  turn = run.catch(() => undefined);
  checks.set(key, run);
  // A check that could not finish (the place it was drawn in went away) is not an answer: asking again must try again.
  run.catch(() => checks.delete(key));
  return run;
}

/** A component, in the examples the engine composes for it. */
export function checkComponent(name: string): Promise<Checked> {
  return checkPlan(name, () => {
    const tour = composeExamples(name);
    return tour && tour.rows.length > 0
      ? {
          drawn: tour.rows.map((e) => ({
            title: e.row.title,
            node: e.node,
            sources: e.printed.sources,
            issues: e.issues,
          })),
          contentFromOptional: tour.contentFromOptional,
        }
      : null;
  });
}

/** A ready-made composition, drawn from its JSON, held to the same rules. */
export function checkTemplate(template: {
  id: string;
  title: string;
  root: Node;
}): Promise<Checked> {
  return checkPlan(`template:${template.id}`, () => ({
    drawn: [
      {
        title: template.title,
        node: template.root,
        sources: printExample(template.root, { importFrom }).sources,
        issues: checkComposition(template.root, { models, exported }),
      },
    ],
    contentFromOptional: [],
  }));
}

/** Forgets what was kept, for one component or all, so the next ask runs the checks again. */
export function forgetCheck(name?: string) {
  if (name) {
    checks.delete(name);
    delete kept[name];
    // Saved as a whole: what stays is written back.
    forgetChecks(storage);
    for (const [kept_name, saved] of Object.entries(kept))
      saveCheck(storage, sourceHash, kept_name, saved);
  } else {
    checks.clear();
    for (const key of Object.keys(kept)) delete kept[key];
    forgetChecks(storage);
  }
}

async function check(name: string, plan: Plan | null): Promise<Checked> {
  if (!plan) return { examples: 0, issues: [], at: Date.now() };
  // With no preview mounted (a test) examples go off screen, where contrast cannot be judged: the other rules still hold.
  const fallback = host
    ? null
    : document.body.appendChild(
        Object.assign(document.createElement("div"), {
          style: "position:absolute;left:-20000px;top:0;width:1200px",
        }),
      );
  const where = host ?? (fallback as HTMLElement);
  const issues: Found[] = [];
  try {
    if (!fallback) {
      setChecking(name.replace(/^template:/, ""));
      await new Promise((done) => setTimeout(done, 50));
    }
    for (const [index, example] of plan.drawn.entries()) {
      if (!where.isConnected)
        throw new Error("the place the examples are drawn in went away");
      const stage = document.createElement("div");
      where.replaceChildren(stage);
      const root = createRoot(stage);
      flushSync(() =>
        root.render(
          <ExampleBoundary>
            {toElement(example.node, resolve, example.sources)}
          </ExampleBoundary>,
        ),
      );
      await settled(stage);
      const found = [
        ...example.issues,
        // The first example sets nothing optional: if the component's content is only optional props, it should show something.
        ...(index === 0
          ? drawsNothing(stage, name, plan.contentFromOptional, [
              example.node.tag,
            ])
          : []),
        ...(await runAxe(stage, [example.node.tag]).catch(() => [] as Issue[])),
      ];
      issues.push(
        ...found.map((issue) => ({ ...issue, example: example.title })),
      );
      root.unmount();
    }
  } finally {
    where.replaceChildren();
    fallback?.remove();
    if (!fallback) setChecking(null);
  }
  return { examples: plan.drawn.length, issues, at: Date.now() };
}
