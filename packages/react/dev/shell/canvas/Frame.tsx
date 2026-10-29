import React, { useRef, useState } from "react";
import { useCanvasScale } from "./Canvas";
import { ScreenWidth } from "./screen";
import classes from "./Frame.module.css";

const MIN = 240;
const MAX = 4000;
const STEP = 16;

const clamp = (width: number) => Math.min(MAX, Math.max(MIN, Math.round(width)));

/**
 * What content is shown in when it is on no device: a frame, as in Figma. It has a width, drawn as a label above it, and its right edge
 * drags (or takes the arrow keys) to make it wider or narrower, so how content behaves at a width can be seen. What fills its container
 * fills the frame. With no width given it fits its content until it is dragged.
 */
export function Frame({ defaultWidth, children }: { defaultWidth: number | null; children: React.ReactNode }) {
  const [width, setWidth] = useState<number | null>(defaultWidth);
  const frame = useRef<HTMLDivElement>(null);
  const scale = useCanvasScale();
  const drag = useRef<{ x: number; start: number } | null>(null);
  const now = () => width ?? frame.current?.offsetWidth ?? MIN;

  return (
    <div className={classes.Wrap} data-component="Shell.Frame">
      <span className={classes.Label}>Frame · {width === null ? "fits content" : `${width} px`}</span>
      <div ref={frame} className={classes.Frame} style={width === null ? undefined : { width }}>
        <ScreenWidth.Provider value={width}>{children}</ScreenWidth.Provider>
        <div
          className={classes.Handle}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize frame"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={width ?? undefined}
          tabIndex={0}
          onPointerDown={(event) => {
            drag.current = { x: event.clientX, start: now() };
            event.currentTarget.setPointerCapture(event.pointerId);
            event.preventDefault();
          }}
          // The canvas may be zoomed: a pointer moved this far on screen is that far over `scale` in the frame.
          onPointerMove={(event) => drag.current && setWidth(clamp(drag.current.start + (event.clientX - drag.current.x) / scale))}
          onPointerUp={(event) => {
            drag.current = null;
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onKeyDown={(event) => {
            const by = (event.shiftKey ? 5 : 1) * STEP;
            if (event.key === "ArrowRight") setWidth(clamp(now() + by));
            else if (event.key === "ArrowLeft") setWidth(clamp(now() - by));
            else return;
            event.preventDefault();
          }}
        />
      </div>
    </div>
  );
}
