import React, { useEffect, useId, useRef, useState } from "react";
import { useCanvasScale, useCanvasSelection } from "../shell/canvas/Canvas";
import { HANDLES, keyDrag, resizeBox } from "./resize";
import type { Box, Handle } from "./resize";
import { useFrames } from "../shell/canvas/FrameStore";
import { ScreenWidth } from "./screen";
import classes from "./Frame.module.css";

const STEP = 16;

const SIDES: Record<Handle, string> = { n: "top", ne: "top right corner", e: "right", se: "bottom right corner", s: "bottom", sw: "bottom left corner", w: "left", nw: "top left corner" };
const isEdge = (handle: Handle) => handle.length === 1;

/**
 * What content is shown in when it is on no device: a frame, as in Figma. It has a name above it and, when it is selected (its name is
 * pressed), eight handles: any side or corner drags it wider, narrower, taller or shorter, and the opposite side stays where it was. Its sides
 * also take the arrow keys. It clips what does not fit and never scrolls (a device does). What fills its container fills the frame; with no
 * size given it is as wide and tall as its content until it is dragged.
 */
export function Frame({
  defaultWidth,
  name,
  id: given,
  children,
}: {
  defaultWidth: number | null;
  /** What the frame is called, as a frame is in Figma. Without one it says its width. */
  name?: string;
  /** What selecting it is known by, for whoever needs to tell which frame is selected (the canvas keeps it). Generated when not given. */
  id?: string;
  children: React.ReactNode;
}) {
  const generated = useId();
  const id = given ?? generated;
  const [width, setWidth] = useState<number | null>(defaultWidth);
  const [height, setHeight] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frame = useRef<HTMLDivElement>(null);
  const scale = useCanvasScale();
  const canvas = useCanvasSelection();
  const [ownSelected, setOwnSelected] = useState(false);
  const selected = canvas ? canvas.selected === id : ownSelected;
  const select = (on: boolean) => (canvas ? canvas.select(on ? id : null) : setOwnSelected(on));
  // Its size, told to whoever shows it (the pane) as it changes: dragged here, or made by what is in it.
  const report = useFrames()?.report;
  useEffect(() => {
    const element = frame.current;
    if (!element || !report) return;
    const tell = () => report(id, { width: Math.round(element.offsetWidth), height: Math.round(element.offsetHeight) });
    tell();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(tell);
    observer.observe(element);
    return () => observer.disconnect();
  }, [id, report]);
  const drag = useRef<{ handle: Handle; x: number; y: number; start: Box } | null>(null);

  /** The box as it is now: what was never set is what the content made it. */
  const current = (): Box => ({ width: width ?? frame.current?.offsetWidth ?? 0, height: height ?? frame.current?.offsetHeight ?? 0, ...offset });
  const apply = (handle: Handle, box: Box) => {
    if (handle.includes("e") || handle.includes("w")) setWidth(box.width);
    if (handle.includes("n") || handle.includes("s")) setHeight(box.height);
    setOffset({ x: box.x, y: box.y });
  };

  const size = `${width ?? frame.current?.offsetWidth ?? "–"} × ${height ?? frame.current?.offsetHeight ?? "–"}`;

  return (
    <div className={classes.Wrap} data-component="Shell.Frame" data-selected={selected ? "" : undefined} style={offset.x || offset.y ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}>
      <button type="button" className={classes.Label} aria-pressed={selected} onClick={() => select(!selected)}>
        {name ?? `Frame · ${width === null ? "fits content" : `${width} px`}`}
      </button>
      <div ref={frame} className={classes.Frame} data-fit={width === null ? "" : undefined} style={{ width: width ?? undefined, height: height ?? undefined }}>
        <div className={classes.Clip}>
          <ScreenWidth.Provider value={width}>{children}</ScreenWidth.Provider>
        </div>
        {selected
          ? HANDLES.map((handle) => (
              <div
                key={handle}
                className={classes.Handle}
                data-handle={handle}
                {...(isEdge(handle)
                  ? {
                      role: "separator",
                      "aria-orientation": handle === "n" || handle === "s" ? "horizontal" : "vertical",
                      "aria-label": `Resize frame: ${SIDES[handle]}`,
                      tabIndex: 0,
                    }
                  : { "aria-hidden": true })}
                onPointerDown={(event) => {
                  drag.current = { handle, x: event.clientX, y: event.clientY, start: current() };
                  event.currentTarget.setPointerCapture(event.pointerId);
                  event.preventDefault();
                }}
                // The canvas may be zoomed: a pointer moved this far on screen is that far over `scale` in the frame.
                onPointerMove={(event) => {
                  const d = drag.current;
                  if (d) apply(d.handle, resizeBox(d.start, d.handle, (event.clientX - d.x) / scale, (event.clientY - d.y) / scale));
                }}
                onPointerUp={(event) => {
                  drag.current = null;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onKeyDown={(event) => {
                  const by = (event.shiftKey ? 5 : 1) * STEP;
                  const moved = keyDrag(handle, event.key, by);
                  if (!moved) return;
                  apply(handle, resizeBox(current(), handle, moved.dx, moved.dy));
                  event.preventDefault();
                }}
              />
            ))
          : null}
      </div>
      {selected ? <span className={classes.Size} aria-hidden="true">{size}</span> : null}
    </div>
  );
}
