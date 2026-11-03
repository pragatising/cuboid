import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { hexToHsv, hsvToHex, normalizeHex } from "../../../utils/color";
import type { Hsv } from "../../../utils/color";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./ColorSpectrum.module.css";

export type ColorSpectrumProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "children" | "defaultValue" | "onChange" | "color"> & {
  /** The colour, as hex (`#1c60d4`). Pair it with `onValueChange`. */
  value: string;
  /** Called with the next colour as hex, as it is dragged or moved with the keys. */
  onValueChange: (value: string) => void;
  /** Names the spectrum. */
  "aria-label": string;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Any colour, by eye: a gradient of saturation (across) and brightness (up) for one hue, and a slider for the hue. The area is a slider
 * (the arrow keys move saturation and brightness, Shift moves ten times as far) and the hue is a range input. It reports hex. The hue is
 * kept while the colour is grey or black, where hex has none, so dragging down to black and back up does not lose it.
 */
export function ColorSpectrum({ value, onValueChange, className, ref, "aria-label": ariaLabel, ...props }: ColorSpectrumProps) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value) ?? { h: 0, s: 0, v: 0 });
  const areaRef = useRef<HTMLDivElement>(null);
  const lastSent = useRef(normalizeHex(value));

  // A colour that arrives from outside (another tab, a typed hex) replaces ours; one we sent ourselves does not, so the hue is not lost to rounding.
  useEffect(() => {
    const incoming = normalizeHex(value);
    if (incoming && incoming !== lastSent.current) {
      lastSent.current = incoming;
      setHsv((now) => {
        const next = hexToHsv(incoming)!;
        return { h: next.s === 0 || next.v === 0 ? now.h : next.h, s: next.s, v: next.v };
      });
    }
  }, [value]);

  const set = (next: Hsv) => {
    const clamped = { h: Math.min(360, Math.max(0, next.h)), s: clamp(next.s), v: clamp(next.v) };
    setHsv(clamped);
    const hex = hsvToHex(clamped);
    lastSent.current = hex;
    onValueChange(hex);
  };

  const fromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    set({ ...hsv, s: (event.clientX - box.left) / box.width, v: 1 - (event.clientY - box.top) / box.height });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.01;
    const move: Record<string, Partial<Hsv>> = { ArrowRight: { s: hsv.s + step }, ArrowLeft: { s: hsv.s - step }, ArrowUp: { v: hsv.v + step }, ArrowDown: { v: hsv.v - step } };
    const change = move[event.key];
    if (!change) return;
    event.preventDefault();
    set({ ...hsv, ...change });
  };

  const percent = (n: number) => Math.round(n * 100);

  return (
    <div {...mergeProps({ "data-component": "ColorSpectrum", role: "group", "aria-label": ariaLabel, className: clsx(classes.Spectrum, className) }, props as object)} ref={ref}>
      <div
        ref={areaRef}
        className={classes.Area}
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent(hsv.s)}
        aria-valuetext={`Saturation ${percent(hsv.s)}%, brightness ${percent(hsv.v)}%`}
        style={{ "--hue": `${hsv.h}`, "--s": `${hsv.s * 100}%`, "--v": `${hsv.v * 100}%`, "--picked": hsvToHex(hsv) } as React.CSSProperties}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture?.(event.pointerId);
          event.currentTarget.focus();
          fromPointer(event);
        }}
        onPointerMove={(event) => event.currentTarget.hasPointerCapture?.(event.pointerId) && fromPointer(event)}
        onKeyDown={onKeyDown}
      >
        <span className={classes.Thumb} aria-hidden="true" />
      </div>
      <input
        className={classes.Hue}
        type="range"
        min={0}
        max={360}
        step={1}
        aria-label="Hue"
        value={Math.round(hsv.h)}
        onChange={(event) => set({ ...hsv, h: Number(event.target.value) })}
      />
    </div>
  );
}
