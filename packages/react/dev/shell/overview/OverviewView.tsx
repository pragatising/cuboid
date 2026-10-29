import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Link, Pill, Table, Text } from "../../../src";
import statusJson from "../../generated/status.json";
import { checkComponent, forgetCheck, groupFindings } from "../issues/check";
import type { Checked } from "../issues/check";
import { ago } from "../issues/store";
import { buildNav } from "../nav";
import type { Status } from "./status";

const statuses = statusJson as Record<string, Status>;

const STATUS_SHADE = { Done: "green", "Seam done": "blue", Todo: "gray", "On hold": "orange", Deleted: "red" } as const;

/** How many findings of each kind a component has (the same findings the Issues tab lists, so the numbers agree). */
function counts(checked: Checked) {
  const groups = groupFindings(checked.issues);
  return {
    error: groups.filter((g) => g.issue.severity === "error").length,
    warning: groups.filter((g) => g.issue.severity === "warning").length,
    info: groups.filter((g) => g.issue.severity === "info").length,
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function IssuePills({ checked }: { checked: Checked | undefined }) {
  if (!checked)
    return (
      <Pill shade="gray" intensity="extraLight" size="sm">
        Checking…
      </Pill>
    );
  if (checked.examples === 0)
    return (
      <Pill shade="gray" intensity="extraLight" size="sm" bordered>
        No example
      </Pill>
    );
  const { error, warning, info } = counts(checked);
  if (error + warning + info === 0)
    return (
      <Pill shade="green" intensity="extraLight" size="sm" bordered>
        Clean
      </Pill>
    );
  return (
    <Box flexDirection="row" gap="0.5x" flexWrap="wrap">
      {error > 0 ? (
        <Pill shade="red" intensity="extraLight" size="sm" bordered>
          {plural(error, "error", "errors")}
        </Pill>
      ) : null}
      {warning > 0 ? (
        <Pill shade="orange" intensity="extraLight" size="sm" bordered>
          {plural(warning, "warning", "warnings")}
        </Pill>
      ) : null}
      {info > 0 ? (
        <Pill shade="gray" intensity="extraLight" size="sm" bordered>
          {plural(info, "check", "checks")}
        </Pill>
      ) : null}
    </Box>
  );
}

/**
 * Every component, its status and its issues, in one table: where the system stands. Status is read from the migration tracker, issues
 * are checked here (each component's composed examples, held to the HTML content model and to WCAG by axe), one component after another,
 * so the table fills as the checks finish. Each name links to the component's own page.
 */
export function OverviewView() {
  const sections = useMemo(() => buildNav(), []);
  const names = useMemo(() => sections.flatMap((section) => section.items.map((item) => ({ name: item.name, section: section.label }))), [sections]);
  const [results, setResults] = useState<Record<string, Checked>>({});
  // Bumped to run every check again; otherwise what was kept from before (see `checkComponent`) is shown at once.
  const [round, setRound] = useState(0);

  useEffect(() => {
    let live = true;
    void (async () => {
      for (const { name } of names) {
        const checked = await checkComponent(name).catch(() => ({ examples: 0, issues: [], at: Date.now() }));
        if (!live) return;
        setResults((all) => ({ ...all, [name]: checked }));
      }
    })();
    return () => {
      live = false;
    };
  }, [names, round]);

  const rerun = () => {
    forgetCheck();
    setResults({});
    setRound((n) => n + 1);
  };

  const oldest = Math.min(Infinity, ...Object.values(results).map((checked) => checked.at));
  const done = Object.keys(results).length;
  const withErrors = names.filter(({ name }) => results[name] && counts(results[name]).error > 0).length;
  const clean = names.filter(({ name }) => results[name] && results[name].examples > 0 && counts(results[name]).error + counts(results[name]).warning + counts(results[name]).info === 0).length;

  return (
    <Box flexDirection="column" gap="2x" padding="2x">
      <Box flexDirection="column" gap="0.5x">
        <Text as="h2" size="lg" weight="semibold" color="neutral.contrast">
          Overview
        </Text>
        <Box flexDirection="row" alignItems="center" gap="1x" flexWrap="wrap">
          <Text size="sm" color="neutral.muted" role="status">
            {done < names.length
              ? `Checking components… ${done} of ${names.length}`
              : `${names.length} components · ${clean} clean · ${plural(withErrors, "has errors", "have errors")} · checked ${ago(oldest)}. Automated checks only; not a claim of WCAG conformance.`}
          </Text>
          <Button variant="ghost" size="sm" onClick={rerun} disabled={done < names.length}>
            Re-run all
          </Button>
        </Box>
      </Box>
      <Table.Root>
        <Table aria-label="Components, their status and issues">
          <Table.Header>
            <Table.Row>
              <Table.HeadCell>Component</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Issues</Table.HeadCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {names.map(({ name }) => {
              const status = statuses[name];
              return (
                <Table.Row key={name}>
                  <Table.Cell>
                    <Link href={`#/${encodeURIComponent(name)}`}>{name}</Link>
                  </Table.Cell>
                  <Table.Cell>
                    <Pill shade={status ? STATUS_SHADE[status] : "gray"} intensity="extraLight" size="sm" bordered={!status}>
                      {status ?? "Not tracked"}
                    </Pill>
                  </Table.Cell>
                  <Table.Cell>
                    <IssuePills checked={results[name]} />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </Table.Root>
    </Box>
  );
}
