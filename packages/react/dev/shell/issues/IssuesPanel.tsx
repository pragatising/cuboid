import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Pill, Text } from "../../../src";
import type { Issue } from "../../engine/content/issue";
import { toElement } from "../../engine/render";
import { runAxe } from "../../engine/wcag/axe";
import { composeExamples } from "../playground/compose";
import { resolve } from "../playground/host";
import classes from "./IssuesPanel.module.css";

type Found = Issue & { example: string };

const ORDER = { error: 0, warning: 1, info: 2 } as const;
const SHADE = { error: "red", warning: "orange", info: "gray" } as const;
const LABEL = { error: "Error", warning: "Warning", info: "Check" } as const;

/** An issue's message without the selector axe adds at its end (`(#_r_1_)`), which differs from one example to the next. */
const whatIt = (message: string) => message.replace(/ \([^()]*\)$/, "");

type Group = { issue: Issue; examples: string[]; count: number };

/** The same finding in several examples is one finding, with the examples it was seen in. */
function grouped(found: Found[]): Group[] {
  const groups = new Map<string, Group>();
  for (const issue of found) {
    const key = `${issue.rule}|${whatIt(issue.message)}`;
    const group = groups.get(key) ?? { issue, examples: [], count: 0 };
    group.count++;
    if (!group.examples.includes(issue.example)) group.examples.push(issue.example);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => ORDER[a.issue.severity] - ORDER[b.issue.severity] || b.count - a.count);
}

/**
 * The component's issues, from every source, in one list (Figma 3354:109752, the Issues tab). The component is checked in the examples
 * the engine composes for it: against the HTML content model as soon as they are composed, and against WCAG by axe once they are drawn,
 * out of sight, in this browser (so contrast is checked too).
 */
export function IssuesPanel({ component }: { component: string }) {
  const tour = useMemo(() => composeExamples(component), [component]);
  const [wcag, setWcag] = useState<Found[]>([]);
  const [checked, setChecked] = useState(0);
  const probe = useRef<HTMLDivElement>(null);
  const total = tour?.rows.length ?? 0;

  useEffect(() => {
    let live = true;
    setWcag([]);
    setChecked(0);
    const run = async () => {
      const stages = [...(probe.current?.children ?? [])];
      for (const [index, stage] of stages.entries()) {
        const example = tour?.rows[index];
        if (!example || !live) return;
        const found = await runAxe(stage, [example.node.tag]).catch(() => [] as Issue[]);
        if (!live) return;
        setWcag((all) => [...all, ...found.map((issue) => ({ ...issue, example: example.row.title }))]);
        setChecked(index + 1);
      }
    };
    void run();
    return () => {
      live = false;
    };
  }, [tour]);

  const found: Found[] = [...(tour?.rows.flatMap((example) => example.issues.map((issue) => ({ ...issue, example: example.row.title }))) ?? []), ...wcag];
  const groups = grouped(found);
  const running = checked < total;

  if (!tour || total === 0) {
    return (
      <Text size="sm" color="neutral.muted">
        {component} has no examples to check yet.
      </Text>
    );
  }

  return (
    <div className={classes.Panel}>
      <Text size="sm" color="neutral.muted" role="status">
        {running
          ? `Checking ${total} ${total === 1 ? "example" : "examples"}… ${checked} done`
          : groups.length === 0
            ? `No issues found in ${total} ${total === 1 ? "example" : "examples"}.`
            : `${groups.length} ${groups.length === 1 ? "issue" : "issues"} in ${total} ${total === 1 ? "example" : "examples"}.`}
      </Text>
      {groups.length > 0 ? (
        <ul className={classes.List} aria-label={`${component} issues`}>
          {groups.map(({ issue, examples, count }) => (
            <li key={`${issue.rule}|${whatIt(issue.message)}`} className={classes.Item}>
              <div className={classes.Head}>
                <Pill shade={SHADE[issue.severity]} intensity="extraLight" size="sm" bordered>
                  {LABEL[issue.severity]}
                </Pill>
                <code className={classes.Rule}>{issue.rule}</code>
                {count > 1 ? <span className={classes.Count}>×{count}</span> : null}
              </div>
              <Text size="sm" color="neutral.contrast">
                {whatIt(issue.message)}
              </Text>
              <div className={classes.Meta}>
                {issue.references.map((reference) =>
                  reference.url ? (
                    <Link key={reference.name} href={reference.url} target="_blank" rel="noreferrer" size="sm">
                      {reference.name}
                    </Link>
                  ) : (
                    <span key={reference.name}>{reference.name}</span>
                  ),
                )}
              </div>
              <Text size="sm" color="neutral.muted">
                In: {examples.join(" · ")}
              </Text>
            </li>
          ))}
        </ul>
      ) : null}
      <Text size="sm" color="neutral.muted">
        Automated checks find what a tool can find. Passing them is not a claim of WCAG conformance: some criteria need a person.
      </Text>
      {/* The examples, drawn off screen to be checked: still in the page (axe ignores what is hidden), never in the way. */}
      <div ref={probe} className={classes.Probe}>
        {tour.rows.map((example, index) => (
          <div key={index}>{toElement(example.node, resolve, example.printed.sources)}</div>
        ))}
      </div>
    </div>
  );
}
