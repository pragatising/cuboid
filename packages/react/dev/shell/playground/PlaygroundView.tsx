import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, EmptyState, Text } from "../../../src";
import { toElement } from "../../engine/render";
import type { Issue } from "../../engine/content/issue";
import { ExampleCode } from "../anatomy/ExampleCode";
import { composeExamples } from "./compose";
import type { Example } from "./compose";
import { resolve } from "./host";
import { runAxe } from "../../engine/wcag/axe";
import { CONTAINER, place } from "./layout";
import type { Layout, Size } from "./layout";
import classes from "./PlaygroundView.module.css";

/**
 * The Playground view: examples composed from the component's props, not written, laid out on the canvas. Each is the component, a
 * line to a card, and the card says what the example is, what it shows that the ones before did not, and the code it is drawn from.
 */
export function PlaygroundView({ component }: { component: string }) {
  const tour = useMemo(() => composeExamples(component), [component]);

  if (!tour || tour.rows.length === 0) {
    return (
      <Box flexGrow={1} alignItems="center" justifyContent="center">
        <EmptyState
          icon="code"
          heading={`${component}: Playground`}
          description={
            tour?.blocked.length
              ? `Needs a value from the host for: ${tour.blocked.map((b) => b.prop).join(", ")}.`
              : "Nothing in its props to vary yet."
          }
        />
      </Box>
    );
  }

  return <Canvas key={component} examples={tour.rows} />;
}

/** How wide a component is in a frame as wide as this, to tell one that fills what it is in from one that has a size of its own. */
const PROBE = 1200;

/**
 * One example: the component, and a card that says what it is. It is drawn twice out of sight first (on its own, and in a wide
 * frame) to measure it; the canvas then says where the card goes.
 */
function Row({ example, index, layout, left, onSize }: { example: Example; index: number; layout?: Layout; left: number; onSize: (index: number, size: Size) => void }) {
  const { row, node, printed } = example;
  const stage = useRef<HTMLDivElement>(null);
  // What the HTML content model said (known before it is drawn), and what WCAG says of it once it is (axe, in this browser: contrast too).
  const [wcag, setWcag] = useState<Issue[]>([]);
  const issues = [...example.issues, ...wcag];
  useEffect(() => {
    let live = true;
    if (stage.current) void runAxe(stage.current, [node.tag]).then((found) => live && setWcag(found), () => undefined);
    return () => {
      live = false;
    };
  }, [node]);
  const alone = useRef<HTMLDivElement>(null);
  const wide = useRef<HTMLDivElement>(null);
  const fluid = useRef(false);

  useLayoutEffect(() => {
    const natural = Math.ceil(alone.current?.getBoundingClientRect().width ?? 0);
    const inWide = wide.current?.firstElementChild?.getBoundingClientRect().width ?? 0;
    fluid.current = inWide >= PROBE * 0.95;
    onSize(index, { natural, fluid: fluid.current });
  }, [index, node, onSize]);

  const element = toElement(node, resolve, printed.sources);
  return (
    <div className={classes.Row} data-layout={layout} data-fluid={layout && fluid.current ? "" : undefined} style={{ ["--left" as string]: `${left}px` }}>
      {/* Out of sight, and out of the page: only to be measured. */}
      <div className={classes.Probe} aria-hidden="true" inert>
        <div ref={alone} className={classes.Alone}>
          {element}
        </div>
        <div ref={wide} className={classes.Wide}>
          {element}
        </div>
      </div>
      <div ref={stage} className={classes.Stage}>
        {element}
      </div>
      <div className={classes.Line} aria-hidden="true" />
      <Box
        as="section"
        aria-label={row.title}
        flexDirection="column"
        gap="1x"
        padding="1x"
        borderRadius="md"
        backgroundColor="canvas.default"
        border="subtle"
        className={classes.Card}
      >
        <Box flexDirection="column" gap="0.5x">
          <Text as="h2" size="sm" weight="semibold" color="neutral.contrast">
            {row.title}
          </Text>
          <Text size="sm" color="neutral.muted">
            {index === 0 ? "The component with nothing set." : `Shows ${row.newValues} ${row.newValues === 1 ? "value" : "values"} not shown above.`}
          </Text>
          {[...new Set(issues.map((issue) => issue.message))].map((message) => {
            const issue = issues.find((i) => i.message === message)!;
            const count = issues.filter((i) => i.message === message).length;
            return (
              <Text key={message} size="sm" color="neutral.contrast">
                {issue.severity === "error" ? "Error" : issue.severity === "warning" ? "Warning" : "Check"} ({issue.rule}){count > 1 ? ` ×${count}` : ""}: {message}
              </Text>
            );
          })}
        </Box>
        <Box padding="1x" borderRadius="md" backgroundColor="canvas.inset" className={classes.Well}>
          <ExampleCode example={{ name: row.title, code: printed.code, lineMap: printed.lineMap }} marked={null} />
        </Box>
      </Box>
    </div>
  );
}

/**
 * The canvas: once every example has been measured, each card goes beside its component or below it (see `place`). The room it
 * decides from is taken once, when the component is opened, so dragging the details pane does not make the examples jump about.
 */
function Canvas({ examples }: { examples: Example[] }) {
  const frame = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const [sizes, setSizes] = useState<Record<number, Size>>({});

  useLayoutEffect(() => {
    setAvailable(frame.current?.clientWidth ?? 0);
  }, []);

  const onSize = React.useCallback(
    (index: number, size: Size) =>
      setSizes((all) => (all[index]?.natural === size.natural && all[index]?.fluid === size.fluid ? all : { ...all, [index]: size })),
    [],
  );

  const ready = available > 0 && examples.every((_, i) => sizes[i]);
  const { layouts, left } = ready ? place(examples.map((_, i) => sizes[i]), available) : { layouts: [], left: 0 };

  return (
    <div ref={frame} data-component="Shell.Playground">
      <div className={classes.Column} data-ready={ready ? "" : undefined} style={{ ["--available" as string]: `${available}px`, ["--container" as string]: `${CONTAINER}px` }}>
        {examples.map((example, index) => (
          <Row key={index} example={example} index={index} layout={layouts[index]} left={left} onSize={onSize} />
        ))}
      </div>
    </div>
  );
}
