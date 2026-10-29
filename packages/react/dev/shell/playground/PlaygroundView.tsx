import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, EmptyState } from "../../../src";
import { toElement } from "../../engine/render";
import { useAnatomy } from "../anatomy/AnatomyContext";
import { useScreenWidth } from "../canvas/screen";
import { printExample } from "../../engine/print";
import { useProps } from "../props/PropsContext";
import { withProps } from "../props/overrides";
import { anatomyExample, composeExamples } from "./compose";
import { ExampleBoundary } from "./ExampleBoundary";
import { importFrom, resolve } from "./host";
import classes from "./PlaygroundView.module.css";

/** How wide a component is in a frame as wide as this, to tell one that fills what it is in from one that has a size of its own. */
const PROBE = 1200;

/**
 * The Playground: one example, the one worth playing with (every part and slot the component has, in no state of its own), on the
 * canvas. Its props are in the right pane, and so is its code, which `setExample` puts there. A component that fills its container
 * (a Header, a Table) is shown in a frame of a stated width; one with a size of its own is shown at that size.
 */
export function PlaygroundView({ component }: { component: string }) {
  const tour = useMemo(() => composeExamples(component), [component]);
  const example = anatomyExample(tour);
  const { setExample } = useAnatomy();
  const play = useProps();

  // What the pane changes goes into the example: the one thing drawn, and the code beside it, is the example with those changes.
  const base = example?.node ?? null;
  const overrides = play?.overrides;
  const node = useMemo(
    () => (base ? withProps(base, component, overrides ?? {}) : null),
    [base, component, overrides],
  );
  const printed = useMemo(
    () => (node ? printExample(node, { importFrom }) : null),
    [node],
  );

  // The pane is told which example this is, and what its props are.
  useEffect(() => {
    play?.setBase(
      example && tour ? { component, doc: tour.doc, node: example.node } : null,
    );
    return () => play?.setBase(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `play` changes with every change made; the example is what this is about
  }, [component, example, tour, play?.setBase]);

  const alone = useRef<HTMLDivElement>(null);
  const wide = useRef<HTMLDivElement>(null);
  const [fluid, setFluid] = useState<boolean | null>(null);
  // The Playground is always in a frame or on a device, and what fills its container fills that.
  const screen = useScreenWidth();
  const onScreen = screen !== null;

  // The code goes to the pane: the example's, with what has been changed.
  useEffect(() => {
    setExample(
      printed
        ? { name: "Default", code: printed.code, lineMap: printed.lineMap }
        : null,
    );
    return () => setExample(null);
  }, [printed, setExample]);

  // Drawn out of sight twice (alone, and in a wide frame) to tell which kind it is.
  useLayoutEffect(() => {
    setFluid(null);
  }, [component]);
  useLayoutEffect(() => {
    if (!example) return;
    setFluid(
      (wide.current?.firstElementChild?.getBoundingClientRect().width ?? 0) >=
        PROBE * 0.95,
    );
  }, [example]);

  if (!example || !node || !printed) {
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

  const element = (
    <ExampleBoundary>
      {toElement(node, resolve, printed.sources)}
    </ExampleBoundary>
  );
  return (
    <div
      className={classes.Canvas}
      data-on-screen={onScreen ? "" : undefined}
      data-component="Shell.Playground"
    >
      <div className={classes.Probe} aria-hidden="true" inert>
        <div ref={alone} className={classes.Alone}>
          {element}
        </div>
        <div ref={wide} className={classes.Wide}>
          {element}
        </div>
      </div>
      <div className={classes.Stage} data-fluid={fluid ? "" : undefined}>
        {element}
      </div>
    </div>
  );
}
