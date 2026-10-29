import React, { useEffect, useState } from "react";
import { Box, Button, Link, Pill, Text } from "../../../src";
import { checkComponent, forgetCheck, groupFindings, whatIt } from "./check";
import type { Checked } from "./check";
import { ago } from "./store";
import classes from "./IssuesPanel.module.css";

const SHADE = { error: "red", warning: "orange", info: "gray" } as const;
const LABEL = { error: "Error", warning: "Warning", info: "Check" } as const;

/**
 * The component's issues, from every source, in one list (Figma 3354:109752, the Issues tab). The component is checked in the examples
 * the engine composes for it: against the HTML content model as soon as they are composed, and against WCAG by axe once they are drawn,
 * out of sight, in this browser (so contrast is checked too).
 */
export function IssuesPanel({
  component,
  check = () => checkComponent(component),
  forgetKey = component,
}: {
  component: string;
  check?: () => Promise<Checked>;
  forgetKey?: string;
}) {
  const [checked, setChecked] = useState<Checked | null>(null);

  // Bumped to check again; otherwise what was kept from before (see `checkComponent`) is shown at once.
  const [round, setRound] = useState(0);

  useEffect(() => {
    let live = true;
    setChecked(null);
    void check().then((result) => live && setChecked(result));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `check` is made new on every render; what it checks is `component`
  }, [component, round]);

  const total = checked?.examples ?? 0;
  const groups = groupFindings(checked?.issues ?? []);

  if (checked && total === 0) {
    return (
      <Text size="sm" color="neutral.muted">
        {component} has no examples to check yet.
      </Text>
    );
  }

  return (
    <div className={classes.Panel}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        gap="1x"
      >
        <Text size="sm" color="neutral.muted" role="status">
          {!checked
            ? "Checking the examples…"
            : `${groups.length === 0 ? "No issues found" : `${groups.length} ${groups.length === 1 ? "issue" : "issues"}`} in ${total} ${total === 1 ? "example" : "examples"} · checked ${ago(checked.at)}.`}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          disabled={!checked}
          onClick={() => {
            forgetCheck(forgetKey);
            setRound((n) => n + 1);
          }}
        >
          Re-run
        </Button>
      </Box>
      {groups.length > 0 ? (
        <ul className={classes.List} aria-label={`${component} issues`}>
          {groups.map(({ issue, examples, count }) => (
            <li
              key={`${issue.rule}|${whatIt(issue.message)}`}
              className={classes.Item}
            >
              <div className={classes.Head}>
                <Pill
                  shade={SHADE[issue.severity]}
                  intensity="extraLight"
                  size="sm"
                  bordered
                >
                  {LABEL[issue.severity]}
                </Pill>
                <code className={classes.Rule}>{issue.rule}</code>
                {count > 1 ? (
                  <span className={classes.Count}>×{count}</span>
                ) : null}
              </div>
              <Text size="sm" color="neutral.contrast">
                {whatIt(issue.message)}
              </Text>
              <div className={classes.Meta}>
                {issue.references.map((reference) =>
                  reference.url ? (
                    <Link
                      key={reference.name}
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                    >
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
        Automated checks find what a tool can find. Passing them is not a claim
        of WCAG conformance: some criteria need a person.
      </Text>
    </div>
  );
}
