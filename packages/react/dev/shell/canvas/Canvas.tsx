import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button, Icon, IconButton } from "../../../src";
import classes from "./Canvas.module.css";

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 4;
const STEP = 1.25;

const CanvasScale = createContext(1);
/** How far the canvas is zoomed, for what is drawn on it and measures by the pointer (a frame's edge). */
export const useCanvasScale = () => useContext(CanvasScale);

export type View = { x: number; y: number; scale: number };

const clamp = (scale: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

/** The view after zooming to `scale` with the point (`px`, `py`) of the viewport staying where it is: the pointer, or the middle. */
export function zoomAt(
  view: View,
  scale: number,
  px: number,
  py: number,
): View {
  const next = clamp(scale);
  return {
    scale: next,
    x: px - ((px - view.x) * next) / view.scale,
    y: py - ((py - view.y) * next) / view.scale,
  };
}

/** The view that shows all of a `content` of this size in a `viewport` of that size, never larger than it is. */
export function fitView(
  viewport: { width: number; height: number },
  content: { width: number; height: number },
  margin = 48,
): View {
  const scale = clamp(
    Math.min(
      (viewport.width - margin * 2) / content.width,
      (viewport.height - margin * 2) / content.height,
      1,
    ),
  );
  return {
    scale,
    x: (viewport.width - content.width * scale) / 2,
    y: (viewport.height - content.height * scale) / 2,
  };
}

/**
 * A canvas like Figma's: what is on it can be zoomed (pinch, or Ctrl or ⌘ with the wheel, around the pointer; the buttons; + and −),
 * and moved (the wheel or a two-finger drag; Space and drag; the middle button; a drag on the empty canvas). 0 is 100%, Shift+1 fits it
 * all. Until it has been moved by hand it keeps the content centred as it changes size (a view that loads late), and after that it leaves it.
 */
export function Canvas({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });
  const touched = useRef(false);
  const viewRef = useRef(view);
  viewRef.current = view;

  const size = useCallback(() => {
    const v = viewport.current;
    const l = layer.current;
    return v && l
      ? {
          viewport: { width: v.clientWidth, height: v.clientHeight },
          content: { width: l.offsetWidth, height: l.offsetHeight },
        }
      : null;
  }, []);

  /** 100%, the content centred across and near the top. */
  const home = useCallback(() => {
    const measured = size();
    if (!measured) return;
    setView({
      scale: 1,
      x: Math.max(0, (measured.viewport.width - measured.content.width) / 2),
      y: Math.max(72, (measured.viewport.height - measured.content.height) / 4),
    });
  }, [size]);

  const change = useCallback((next: View | ((current: View) => View)) => {
    touched.current = true;
    setView(next);
  }, []);

  const zoomBy = useCallback(
    (factor: number, point?: { x: number; y: number }) => {
      const v = viewport.current;
      if (!v) return;
      const at = point ?? { x: v.clientWidth / 2, y: v.clientHeight / 2 };
      change((current) => zoomAt(current, current.scale * factor, at.x, at.y));
    },
    [change],
  );

  const fit = useCallback(() => {
    const measured = size();
    if (measured) change(fitView(measured.viewport, measured.content));
  }, [size, change]);

  // Centred, and kept so while the content is still arriving.
  useLayoutEffect(() => {
    home();
    const l = layer.current;
    if (!l || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (!touched.current) home();
    });
    observer.observe(l);
    return () => observer.disconnect();
  }, [home]);

  // The wheel: zoom with Ctrl or ⌘ (a pinch on a trackpad arrives as Ctrl+wheel), move otherwise. It must not be passive to stop the page's own.
  useEffect(() => {
    const v = viewport.current;
    if (!v) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        const rect = v.getBoundingClientRect();
        change((current) =>
          zoomAt(
            current,
            current.scale * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.005),
            event.clientX - rect.left,
            event.clientY - rect.top,
          ),
        );
      } else
        change((current) => ({
          ...current,
          x: current.x - event.deltaX,
          y: current.y - event.deltaY,
        }));
    };
    v.addEventListener("wheel", onWheel, { passive: false });
    return () => v.removeEventListener("wheel", onWheel);
  }, [change]);

  // Dragging moves it: Space and drag, the middle button, or a drag that starts on the empty canvas.
  const drag = useRef<{ x: number; y: number } | null>(null);
  const space = useRef(false);
  const [grabbing, setGrabbing] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);

  useEffect(() => {
    const editing = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const down = (event: KeyboardEvent) => {
      if (
        event.code === "Space" &&
        !editing(event.target) &&
        viewport.current?.contains(document.activeElement)
      ) {
        space.current = true;
        setSpaceDown(true);
        event.preventDefault();
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        space.current = false;
        setSpaceDown(false);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const empty =
      event.target === viewport.current || event.target === layer.current;
    if (!(
      event.button === 1 ||
      (event.button === 0 && (space.current || empty))
    ))
      return;
    drag.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setGrabbing(true);
    event.preventDefault();
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    drag.current = { x: event.clientX, y: event.clientY };
    change((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setGrabbing(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.target !== viewport.current) return;
    if (event.key === "+" || event.key === "=") zoomBy(STEP);
    else if (event.key === "-" || event.key === "_") zoomBy(1 / STEP);
    else if (event.key === "0") {
      touched.current = false;
      home();
    } else if (event.key === "!" || (event.shiftKey && event.key === "1"))
      fit();
    else return;
    event.preventDefault();
  };

  return (
    <div
      ref={viewport}
      className={classes.Viewport}
      role="application"
      aria-label={label}
      aria-roledescription="canvas"
      tabIndex={0}
      data-component="Shell.Canvas"
      data-grab={grabbing ? "grabbing" : spaceDown ? "grab" : undefined}
      style={{
        ["--x" as string]: `${view.x}px`,
        ["--y" as string]: `${view.y}px`,
        ["--scale" as string]: view.scale,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      <div ref={layer} className={classes.Layer}>
        <CanvasScale.Provider value={view.scale}>{children}</CanvasScale.Provider>
      </div>
      <div
        className={classes.Controls}
        role="toolbar"
        aria-label="Zoom"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Zoom out"
          icon={<Icon name="remove" />}
          onClick={() => zoomBy(1 / STEP)}
        />
        <Button
          variant="ghost"
          size="sm"
          aria-label="Zoom to 100%"
          onClick={() => {
            touched.current = false;
            home();
          }}
        >
          {Math.round(view.scale * 100)}%
        </Button>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Zoom in"
          icon={<Icon name="add" />}
          onClick={() => zoomBy(STEP)}
        />
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Fit to screen"
          icon={<Icon name="fit_screen" />}
          onClick={fit}
        />
      </div>
    </div>
  );
}
