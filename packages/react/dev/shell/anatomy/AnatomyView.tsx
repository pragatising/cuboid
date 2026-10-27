import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box, EmptyState } from "../../../src";
import { loadPreviewSource } from "../states/source";
import { parseRange, useAnatomy } from "./AnatomyContext";
import type { LineRange } from "./AnatomyContext";
import type { PreviewSource } from "../states/source";
import classes from "./AnatomyView.module.css";

type Part = {
  key: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  container: boolean;
  lines: LineRange | null;
};

/**
 * The named parts of what is on the stage, wherever they are drawn. A popup is portaled to the end of the page, so it is not
 * inside the stage: it is found through the `aria-controls` of the trigger that opens it.
 */
function partElements(stage: HTMLElement): HTMLElement[] {
  const roots: HTMLElement[] = [stage];
  stage.querySelectorAll<HTMLElement>("[aria-controls]").forEach((trigger) => {
    const panel = document.getElementById(
      trigger.getAttribute("aria-controls") ?? "",
    );
    if (panel && !stage.contains(panel)) roots.push(panel);
  });
  const parts = new Set<HTMLElement>();
  for (const root of roots) {
    if (root !== stage && root.hasAttribute("data-component")) parts.add(root);
    root
      .querySelectorAll<HTMLElement>("[data-component]")
      .forEach((element) => parts.add(element));
  }
  return [...parts];
}

/**
 * The lines of the story that wrote this part: the nearest element at or above it that the story tagged (see dev/storySource.ts).
 * A popup's panel is not under the story's element in the DOM, so it is followed back through the trigger that opens it.
 */
function linesOf(element: HTMLElement): LineRange | null {
  const own = parseRange(
    element.closest("[data-src]")?.getAttribute("data-src"),
  );
  if (own) return own;
  for (
    let ancestor: HTMLElement | null = element;
    ancestor;
    ancestor = ancestor.parentElement
  ) {
    if (!ancestor.id) continue;
    const trigger = document.querySelector(
      `[aria-controls="${CSS.escape(ancestor.id)}"]`,
    );
    const lines = parseRange(
      trigger?.closest("[data-src]")?.getAttribute("data-src"),
    );
    if (lines) return lines;
  }
  return null;
}

/** Each part's box on screen. A part that holds other parts is a container; the ones that hold none are the leaves. */
function measure(stage: HTMLElement): Part[] {
  const elements = partElements(stage);
  const parts = elements.flatMap((element, index) => {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return [];
    const container = elements.some(
      (other) => other !== element && element.contains(other),
    );
    return [
      {
        key: `${index}-${element.getAttribute("data-component")}`,
        name: element.getAttribute("data-component") ?? "",
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        container,
        lines: linesOf(element),
      },
    ];
  });
  // Larger first, so a part is drawn over the one that contains it.
  return parts.sort((a, b) => b.width * b.height - a.width * a.height);
}

/**
 * The Anatomy view. The component's example is drawn as it is; "Show Structure" lays a box over each part that has a
 * `data-component` name (the system's own names for its parts, not hashed classes). A part with no name has no box, so it shows
 * as a gap. Menus and other popups are opened for you, because their parts are the point.
 */
export function AnatomyView({ component }: { component: string }) {
  const [source, setSource] = useState<PreviewSource | null | undefined>(
    undefined,
  );
  const [parts, setParts] = useState<Part[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const { setStory, setHover, structure: show } = useAnatomy();

  useLayoutEffect(() => {
    setSource(undefined);
    let current = true;
    void loadPreviewSource(component).then((loaded) => {
      if (!current) return;
      setSource(loaded);
      setStory(loaded?.story ?? null);
    });
    return () => {
      current = false;
      setStory(null);
      setHover(null);
    };
  }, [component, setStory, setHover]);

  // Open what opens, as a person would by clicking it. A press outside closes it again (the switch is outside), so this runs on a toggle too.
  useEffect(() => {
    if (!source) return;
    const id = window.setTimeout(
      () =>
        stage.current
          ?.querySelectorAll<HTMLElement>(
            '[aria-haspopup][aria-expanded="false"]',
          )
          .forEach((trigger) => trigger.click()),
      150,
    );
    return () => window.clearTimeout(id);
  }, [source, show]);

  // Boxes follow the parts while they move (a popup places itself after it opens; the page scrolls).
  useEffect(() => {
    if (!show || !source) {
      setParts([]);
      return;
    }
    let frame = 0;
    let last = "";
    const tick = () => {
      if (stage.current) {
        const next = measure(stage.current);
        const signature = JSON.stringify(next);
        if (signature !== last) {
          last = signature;
          setParts(next);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [show, source]);

  if (source === null) {
    return (
      <Box flexGrow={1} alignItems="center" justifyContent="center">
        <EmptyState
          icon="account_tree"
          heading={`${component}: Anatomy`}
          description="No story to draw this component from yet."
        />
      </Box>
    );
  }
  if (!source) return null;

  return (
    <div className={classes.View} data-component="Shell.Anatomy">
      <div ref={stage} className={classes.Stage}>
        <source.Example />
        <div className={classes.Overlay}>
          {parts.map((part) => (
            <div
              key={part.key}
              className={classes.Box}
              data-part={part.name}
              data-container={part.container ? "" : undefined}
              data-leaf={part.container ? undefined : ""}
              style={{
                left: part.x,
                top: part.y,
                width: part.width,
                height: part.height,
              }}
              onPointerEnter={() => setHover(part.lines)}
              onPointerLeave={() => setHover(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
