import React, { useMemo, useState } from "react";
import { Box, EmptyState, SegmentedControl, Text } from "../../../src";
import modelsJson from "../../generated/models.json";
import { cover } from "../../engine/cover";
import { allowedBy, domainsOf } from "../../engine/domains";
import { buildNode, printExample } from "../../engine/print";
import { toElement } from "../../engine/render";
import { recognise } from "../../engine/recognise/recognise";
import type { Models } from "../../engine/recognise/recognise";
import { ExampleCode } from "../anatomy/ExampleCode";
import { fixtures, importFrom, resolve } from "./host";
import classes from "./ExamplesView.module.css";

const { exports: exported, models } = modelsJson as unknown as { exports: Record<string, string>; models: Models };

const STRENGTHS = [
  { id: "1", label: "Each value" },
  { id: "2", label: "Each pair" },
] as const;

/**
 * The Example view: examples composed from the component's props, not written. Each one is built to show something the ones before
 * it did not, and says what; the code under it is what it is drawn from, to copy.
 */
export function ExamplesView({ component }: { component: string }) {
  const model = models[exported[component]];
  const [strength, setStrength] = useState<"1" | "2">("1");

  const tour = useMemo(() => {
    if (!model) return null;
    const { doc, conditions, scenarios } = recognise(model, models, exported);
    const { domains, skipped, blocked } = domainsOf(doc, fixtures);
    if (domains.length === 0 || blocked.length > 0) return { domains, skipped, blocked, rows: [] as never[], all: 0 };
    const { rows, uncovered } = cover(domains, { strength: Number(strength) as 1 | 2, valid: allowedBy([[...conditions, ...scenarios], ...(fixtures.exclusive ?? [])]) });
    const all = domains.reduce((n, d) => n * d.choices.length, 1);
    const examples = rows.map((row) => {
      const node = buildNode(doc, row.picks);
      const printed = printExample(node, { importFrom });
      return { row, node, printed };
    });
    return { domains, skipped, blocked, rows: examples, all, uncovered };
  }, [model, strength]);

  // Handlers, refs, functions and app-held state never need an example; free values and open sets are what a host could supply.
  const gaps = tour?.skipped.filter((s) => ["value", "open", "other"].includes(s.kind)).map((s) => s.prop) ?? [];

  if (!model || !tour || tour.rows.length === 0) {
    return (
      <Box flexGrow={1} alignItems="center" justifyContent="center">
        <EmptyState
          icon="code"
          heading={`${component}: Example`}
          description={
            tour?.blocked.length
              ? `Needs a value from the host for: ${tour.blocked.map((b) => b.prop).join(", ")}.`
              : "Nothing in its props to vary yet."
          }
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" gap="2x" data-component="Shell.Examples">
      <Box flexDirection="row" alignItems="center" gap="2x" flexWrap="wrap">
        <SegmentedControl aria-label="What the examples show" value={strength} onValueChange={(v) => setStrength(v as "1" | "2")}>
          {STRENGTHS.map((s) => (
            <SegmentedControl.Item key={s.id} value={s.id}>
              {s.label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
        <Text size="sm" color="neutral.muted">
          {tour.rows.length} {tour.rows.length === 1 ? "example" : "examples"} instead of {tour.all.toLocaleString("en")} combinations
          {gaps.length > 0 ? ` · needs samples for: ${gaps.join(", ")}` : ""}
          {tour.uncovered?.length ? ` · never together: ${tour.uncovered.map((key) => key.replace(/=on/g, "").replace("&", " + ")).join(", ")}` : ""}
        </Text>
      </Box>
      {tour.rows.map(({ row, node, printed }, index) => (
        <Box
          key={`${strength}-${index}`}
          as="section"
          aria-label={row.title}
          flexDirection="column"
          gap="1x"
          padding="2x"
          borderRadius="md"
          backgroundColor="canvas.default"
          border="subtle"
        >
          <Text as="h2" size="sm" weight="semibold" color="neutral.contrast">
            {row.title}
          </Text>
          <Text size="sm" color="neutral.muted">
            {index === 0
              ? "The component with nothing set."
              : `Shows ${row.newValues} ${row.newValues === 1 ? "value" : "values"}${strength === "2" ? ` and ${row.newPairs} ${row.newPairs === 1 ? "pair" : "pairs"}` : ""} not shown above.`}
          </Text>
          <Box flexDirection="row" alignItems="flex-start" padding="2x" className={classes.Stage}>
            {toElement(node, resolve, printed.sources)}
          </Box>
          <ExampleCode example={{ name: row.title, code: printed.code, lineMap: printed.lineMap }} marked={null} />
        </Box>
      ))}
    </Box>
  );
}
