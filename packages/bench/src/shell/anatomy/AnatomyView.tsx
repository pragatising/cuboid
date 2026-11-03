import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Preview } from "../../frame";
import type { LoadedPage } from "../../frame";
import { Box, EmptyState } from "../../ui/index";
import { useProps } from "../props/PropsContext";
import { loadPreviewSource } from "../states/source";
import { parseSource, useAnatomy } from "./AnatomyContext";
import type { Highlight } from "./AnatomyContext";
import type { PreviewSource } from "../states/source";
import classes from "./AnatomyView.module.css";

/** A box on the screen: where something in the frame's page is, as the shell sees it. */
type Rect = { x: number; y: number; width: number; height: number };

type Part = Rect & {
  key: string;
  name: string;
  container: boolean;
};

/** What the pointer is over: the element the example wrote, where it is on screen, and the piece of the example that wrote it. */
type Inspected = Rect & {
  key: string;
  name: string;
  highlight: Highlight;
};

/** The least height of the frame: what is drawn in it opens menus and popups, and they are drawn in the frame's page, which is as tall as what it draws. */
const FRAME_HEIGHT = 640;

/**
 * Where a box of the frame's page is on the shell's screen. The page is a document of its own, drawn at the canvas's scale: a point in it is
 * that much further from the frame's corner on screen. Whatever the shell draws over it (the boxes, the outline) goes through this.
 */
function onScreen(page: LoadedPage, rect: DOMRect): Rect {
  const frame = page.frame.getBoundingClientRect();
  const scale = page.frame.offsetWidth ? frame.width / page.frame.offsetWidth : 1;
  return { x: frame.left + rect.left * scale, y: frame.top + rect.top * scale, width: rect.width * scale, height: rect.height * scale };
}

/** The named parts of what is on the page: every element the system gave a `data-component` name, popups included (they are in the page's body). */
function partElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-component]"));
}

/**
 * The piece of the example that wrote what is under the pointer: the nearest element at or above it that the example tagged (see
 * engine/render.tsx), and that element, which is what gets the outline. A popup's panel is not under the example's element in
 * the DOM, so it is followed back through the trigger that opens it.
 */
function sourceOf(element: HTMLElement): { element: HTMLElement; highlight: Highlight } | null {
  const tagged = element.closest<HTMLElement>("[data-src]");
  const own = parseSource(tagged?.getAttribute("data-src"));
  if (tagged && own) return { element: tagged, highlight: own };
  const page = element.ownerDocument;
  for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
    if (!ancestor.id) continue;
    const trigger = page.querySelector(`[aria-controls="${CSS.escape(ancestor.id)}"]`);
    const highlight = parseSource(trigger?.closest("[data-src]")?.getAttribute("data-src"));
    if (highlight) return { element: ancestor, highlight };
  }
  return null;
}

/** Each part's box on screen. A part that holds other parts is a container; the ones that hold none are the leaves. */
function measure(page: LoadedPage): Part[] {
  const elements = partElements(page.document.body);
  const parts = elements.flatMap((element, index) => {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return [];
    const container = elements.some((other) => other !== element && element.contains(other));
    return [{ key: `${index}-${element.getAttribute("data-component")}`, name: element.getAttribute("data-component") ?? "", container, ...onScreen(page, rect) }];
  });
  // Larger first, so a part is drawn over the one that contains it.
  return parts.sort((a, b) => b.width * b.height - a.width * a.height);
}

/**
 * The Anatomy view. The component's example is drawn in a frame, a page of its own (as an Examples frame is), as it is. Hover any of it, as in Figma's inspect mode: the element is
 * outlined with its name, and the piece of the example that wrote it is marked in the right pane. "Show Structure" also lays a box
 * over every part that has a `data-component` name (the system's own names, not hashed classes); a part with no name has no
 * box, so it shows as a gap. Menus and other popups are opened for you, because their parts are the point; clicks are
 * inspected, not performed, so a menu does not close when you point at its items. The frame owns what is drawn in it, popups and all; the canvas only moves and scales the frame, so nothing here depends on where the canvas is.
 */
export function AnatomyView({ component }: { component: string }) {
  const [source, setSource] = useState<PreviewSource | null | undefined>(undefined);
  const [page, setPage] = useState<LoadedPage | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [inspected, setInspected] = useState<Inspected | null>(null);
  const opening = useRef(false);
  const { setExample, setHover, structure: show } = useAnatomy();
  const play = useProps();
  const overrides = play?.overrides;
  const setBase = play?.setBase;

  useLayoutEffect(() => {
    setSource(undefined);
    let current = true;
    void loadPreviewSource(component).then((loaded) => {
      if (!current) return;
      setSource(loaded);
    });
    return () => {
      current = false;
      setExample(null);
      setHover(null);
    };
  }, [component, setExample, setHover]);

  // The example is what the pane plays with: its props are the component's own, to change here as they are in an Examples frame. What is changed is
  // drawn, and the code beside it follows.
  useEffect(() => {
    if (!source?.play || !setBase) return;
    setBase({ component, doc: source.play.doc, node: source.play.node, scope: component });
    return () => setBase(null);
  }, [source, component, setBase]);
  useEffect(() => {
    if (source) setExample(source.codeWith(overrides ?? {}));
  }, [source, overrides, setExample]);

  // What the frame is shown: the example with what is changed in it, as data.
  const content = useMemo(() => (source ? source.shown(overrides ?? {}) : null), [source, overrides]);

  // Open what opens, as a person would by clicking it. A press outside closes it again (the switch is outside), so this runs on a toggle too.
  // The frame draws after it is told to, so this waits for it.
  useEffect(() => {
    if (!page) return;
    const id = window.setTimeout(() => {
      opening.current = true;
      page.document.body.querySelectorAll<HTMLElement>('[aria-haspopup][aria-expanded="false"]').forEach((trigger) => trigger.click());
      opening.current = false;
    }, 400);
    return () => window.clearTimeout(id);
  }, [page, show, content]);

  // The inspector: whatever the story wrote that is under the pointer, outlined, and its source marked in the pane. It reads the frame's own
  // document (the same origin) and puts its answers on the shell's screen.
  useEffect(() => {
    if (!page) return;
    const doc = page.document;
    let lastKey = "";
    // The element that is outlined: the outline is placed by where it is now, so it stays on it when the canvas is zoomed or moved.
    let outlined: HTMLElement | null = null;
    const clear = () => {
      outlined = null;
      if (lastKey === "") return;
      lastKey = "";
      setInspected(null);
      setHover(null);
    };
    const keyOf = (element: HTMLElement) => {
      const rect = onScreen(page, element.getBoundingClientRect());
      return `${element.getAttribute("data-src") ?? ""}|${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)},${Math.round(rect.height)}`;
    };
    const onMove = (event: PointerEvent) => {
      const target = doc.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      if (!target) return clear();
      const found = sourceOf(target);
      if (!found) return clear();
      const key = keyOf(found.element);
      if (key === lastKey) return;
      lastKey = key;
      outlined = found.element;
      setInspected({
        key,
        name: found.element.getAttribute("data-component") ?? found.element.tagName.toLowerCase(),
        ...onScreen(page, found.element.getBoundingClientRect()),
        highlight: found.highlight,
      });
      setHover(found.highlight);
    };
    // Inspecting is not using: a click on the example is stopped before the component sees it, except the one that opens a popup.
    const onClick = (event: MouseEvent) => {
      if (opening.current) return;
      event.preventDefault();
      event.stopPropagation();
    };
    // The canvas moves under a still pointer (the wheel zooms it, Space drags it), and no pointer event says so: the outline is read again each frame.
    let frame = 0;
    const follow = () => {
      if (outlined) {
        if (!outlined.isConnected) clear();
        else {
          const key = keyOf(outlined);
          if (key !== lastKey) {
            lastKey = key;
            const rect = onScreen(page, outlined.getBoundingClientRect());
            setInspected((now) => (now ? { ...now, key, ...rect } : now));
          }
        }
      }
      frame = requestAnimationFrame(follow);
    };
    follow();
    doc.addEventListener("pointermove", onMove);
    doc.documentElement.addEventListener("pointerleave", clear);
    doc.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(frame);
      doc.removeEventListener("pointermove", onMove);
      doc.documentElement.removeEventListener("pointerleave", clear);
      doc.removeEventListener("click", onClick, true);
      clear();
    };
  }, [page, setHover]);

  // Boxes follow the parts while they move (a popup places itself after it opens; the canvas moves the frame).
  useEffect(() => {
    if (!show || !page) {
      setParts([]);
      return;
    }
    let frame = 0;
    let last = "";
    const tick = () => {
      const next = measure(page);
      const signature = JSON.stringify(next);
      if (signature !== last) {
        last = signature;
        setParts(next);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [show, page]);

  if (source === null) {
    return (
      <Box flexGrow={1} alignItems="center" justifyContent="center">
        <EmptyState icon="account_tree" heading={`${component}: Anatomy`} description="No story to draw this component from yet." />
      </Box>
    );
  }
  if (!source) return null;

  return (
    <div className={classes.View} data-component="Shell.Anatomy">
      <div className={classes.Stage}>
        <Preview content={content} title={`${component}: Anatomy`} minHeight={FRAME_HEIGHT} onPage={setPage} />
        {/* Drawn in the shell's page, over the frame: the boxes are placed by where parts are on screen, which is where the frame is. */}
        {createPortal(
          <div className={classes.Overlay} aria-hidden="true">
            {parts.map((part) => (
              <div
                key={part.key}
                className={classes.Box}
                data-part={part.name}
                data-container={part.container ? "" : undefined}
                data-leaf={part.container ? undefined : ""}
                style={{ left: part.x, top: part.y, width: part.width, height: part.height }}
              />
            ))}
            {inspected ? (
              <>
                <div className={classes.Inspected} data-inspected={inspected.name} style={{ left: inspected.x, top: inspected.y, width: inspected.width, height: inspected.height }} />
                <span className={classes.Chip} style={{ left: inspected.x, top: Math.max(inspected.y - 22, 4) }}>
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
