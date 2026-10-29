import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useScreenWidth } from "../canvas/screen";
import { Box, EmptyState } from "../../../src";
import { loadPreviewSource } from "../states/source";
import { parseSource, useAnatomy } from "./AnatomyContext";
import type { Highlight } from "./AnatomyContext";
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
};

/** What the pointer is over: the element the example wrote, where it is on screen, and the piece of the example that wrote it. */
type Inspected = {
  key: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  highlight: Highlight;
};

/**
 * The places the example is drawn: the stage, and each popup it has opened. A popup is portaled to the end of the page, so it is
 * not inside the stage: it is found through the `aria-controls` of the trigger that opens it.
 */
function rootsOf(stage: HTMLElement): HTMLElement[] {
  const roots: HTMLElement[] = [stage];
  stage.querySelectorAll<HTMLElement>("[aria-controls]").forEach((trigger) => {
    const panel = document.getElementById(
      trigger.getAttribute("aria-controls") ?? "",
    );
    if (panel && !stage.contains(panel)) roots.push(panel);
  });
  return roots;
}

/** The named parts of what is on the stage, wherever they are drawn. */
function partElements(stage: HTMLElement): HTMLElement[] {
  const parts = new Set<HTMLElement>();
  for (const root of rootsOf(stage)) {
    if (root !== stage && root.hasAttribute("data-component")) parts.add(root);
    root
      .querySelectorAll<HTMLElement>("[data-component]")
      .forEach((element) => parts.add(element));
  }
  return [...parts];
}

/**
 * The piece of the example that wrote what is under the pointer: the nearest element at or above it that the example tagged (see
 * dev/storySource.ts), and that element, which is what gets the outline. A popup's panel is not under the example's element in
 * the DOM, so it is followed back through the trigger that opens it.
 */
function sourceOf(
  element: HTMLElement,
): { element: HTMLElement; highlight: Highlight } | null {
  const tagged = element.closest<HTMLElement>("[data-src]");
  const own = parseSource(tagged?.getAttribute("data-src"));
  if (tagged && own) return { element: tagged, highlight: own };
  for (
    let ancestor: HTMLElement | null = element;
    ancestor;
    ancestor = ancestor.parentElement
  ) {
    if (!ancestor.id) continue;
    const trigger = document.querySelector(
      `[aria-controls="${CSS.escape(ancestor.id)}"]`,
    );
    const highlight = parseSource(
      trigger?.closest("[data-src]")?.getAttribute("data-src"),
    );
    if (highlight) return { element: ancestor, highlight };
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
      },
    ];
  });
  // Larger first, so a part is drawn over the one that contains it.
  return parts.sort((a, b) => b.width * b.height - a.width * a.height);
}

/**
 * The Anatomy view. The component's example is drawn as it is. Hover any of it, as in Figma's inspect mode: the element is
 * outlined with its name, and the piece of the example that wrote it is marked in the right pane. "Show Structure" also lays a box
 * over every part that has a `data-component` name (the system's own names, not hashed classes); a part with no name has no
 * box, so it shows as a gap. Menus and other popups are opened for you, because their parts are the point; clicks are
 * inspected, not performed, so a menu does not close when you point at its items.
 */
export function AnatomyView({ component }: { component: string }) {
  const [source, setSource] = useState<PreviewSource | null | undefined>(
    undefined,
  );
  const [parts, setParts] = useState<Part[]>([]);
  const [inspected, setInspected] = useState<Inspected | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const opening = useRef(false);
  const { setExample, setHover, structure: show } = useAnatomy();
  // On a screen the example has that much room, so the generous margin around it (for the structure to be seen) is cut down.
  const screen = useScreenWidth();

  useLayoutEffect(() => {
    setSource(undefined);
    let current = true;
    void loadPreviewSource(component).then((loaded) => {
      if (!current) return;
      setSource(loaded);
      setExample(loaded?.example ?? null);
    });
    return () => {
      current = false;
      setExample(null);
      setHover(null);
    };
  }, [component, setExample, setHover]);

  // Open what opens, as a person would by clicking it. A press outside closes it again (the switch is outside), so this runs on a toggle too.
  useEffect(() => {
    if (!source) return;
    const id = window.setTimeout(() => {
      opening.current = true;
      stage.current
        ?.querySelectorAll<HTMLElement>(
          '[aria-haspopup][aria-expanded="false"]',
        )
        .forEach((trigger) => trigger.click());
      opening.current = false;
    }, 150);
    return () => window.clearTimeout(id);
  }, [source, show]);

  // The inspector: whatever the story wrote that is under the pointer, outlined, and its source marked in the pane.
  useEffect(() => {
    if (!source) return;
    let lastKey = "";
    const clear = () => {
      if (lastKey === "") return;
      lastKey = "";
      setInspected(null);
      setHover(null);
    };
    const onMove = (event: PointerEvent) => {
      const target = document.elementFromPoint(
        event.clientX,
        event.clientY,
      ) as HTMLElement | null;
      const root = stage.current;
      if (
        !target ||
        !root ||
        !rootsOf(root).some((area) => area.contains(target))
      )
        return clear();
      const found = sourceOf(target);
      if (!found) return clear();
      const rect = found.element.getBoundingClientRect();
      const key = `${found.element.getAttribute("data-src") ?? ""}|${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${Math.round(rect.height)}`;
      if (key === lastKey) return;
      lastKey = key;
      setInspected({
        key,
        name:
          found.element.getAttribute("data-component") ??
          found.element.tagName.toLowerCase(),
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        highlight: found.highlight,
      });
      setHover(found.highlight);
    };
    // Inspecting is not using: a click on the example is stopped before the component sees it, except the one that opens a popup.
    const onClick = (event: MouseEvent) => {
      const root = stage.current;
      if (opening.current || !root || !(event.target instanceof Node)) return;
      if (rootsOf(root).some((area) => area.contains(event.target as Node))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("click", onClick, true);
      clear();
    };
  }, [source, setHover]);

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
      <div
        ref={stage}
        className={classes.Stage}
        style={screen === null ? undefined : { padding: "48px 24px 160px" }}
      >
        <source.Example />
        {/* Drawn in the page, not in the canvas: the boxes are placed by where parts are on screen, and a zoomed canvas would move them. */}
        {createPortal(
          <div className={classes.Overlay} aria-hidden="true">
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
              />
            ))}
            {inspected ? (
              <>
                <div
                  className={classes.Inspected}
                  data-inspected={inspected.name}
                  style={{
                    left: inspected.x,
                    top: inspected.y,
                    width: inspected.width,
                    height: inspected.height,
                  }}
                />
                <span
                  className={classes.Chip}
                  style={{
                    left: inspected.x,
                    top: Math.max(inspected.y - 22, 4),
                  }}
                >
                  {inspected.name}
                </span>
              </>
            ) : null}
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
}
