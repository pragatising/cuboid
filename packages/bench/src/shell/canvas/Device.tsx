import React, { useEffect } from "react";
import { Icon } from "../../ui/index";
import { Frame, ScreenScrolls, ScreenWidth } from "../../frame";
import { useCanvasSelection } from "./Canvas";
import { useFrames } from "./FrameStore";
import classes from "./Device.module.css";

export type DeviceId = "none" | "desktop" | "tablet" | "phone";

type Spec = {
  label: string;
  width: number;
  height: number;
  kind: "window" | "tablet" | "phone";
};

/** The screens content can be shown on: their viewport in CSS pixels (what a page sees as its window). */
export const DEVICES: Record<Exclude<DeviceId, "none">, Spec> = {
  desktop: {
    label: "Desktop · MacBook Air",
    width: 1440,
    height: 900,
    kind: "window",
  },
  tablet: { label: "Tablet · iPad", width: 820, height: 1180, kind: "tablet" },
  phone: { label: "Phone · iPhone", width: 390, height: 844, kind: "phone" },
};

export const DEVICE_OPTIONS: { id: DeviceId; label: string }[] = [
  { id: "none", label: "No device" },
  ...(Object.entries(DEVICES).map(([id, spec]) => ({
    id,
    label: spec.label,
  })) as { id: DeviceId; label: string }[]),
];

/**
 * Content shown as it would be on a screen: in a browser window (traffic lights, and an address bar with the page's address) at the
 * device's size, or on a tablet or a phone. The viewport scrolls on its own, as a page does. With no device the content is in a frame (see `Frame`) that fits it, or has the width it is given.
 * (A component that asks the window how wide it is sees this page's window, not the device's: the size is the device's, the window is not.)
 */
export function Device({
  device,
  url,
  frameWidth,
  name,
  id,
  children,
}: {
  device: DeviceId;
  url: string;
  /** The width of the frame content is in when there is no device (null: it fits the content). */
  frameWidth: number | null;
  /** What the frame is called (on a device, the address says what it shows). */
  name?: string;
  /** What selecting the frame is known by (see `Frame`). */
  id?: string;
  children: React.ReactNode;
}) {
  const frames = useFrames();
  const canvas = useCanvasSelection();
  // A device's size is its screen's: told to whoever shows it (the pane), as a frame tells its own.
  const report = frames?.report;
  useEffect(() => {
    if (id && device !== "none" && report) report(id, { width: DEVICES[device].width, height: DEVICES[device].height });
  }, [id, device, report]);
  // No device is a frame: it has a width, and can be made wider or narrower.
  if (device === "none") return <Frame defaultWidth={frameWidth} name={name} id={id}>{children}</Frame>;
  const spec = DEVICES[device];
  const selected = id !== undefined && canvas?.selected === id;
  const screen = (
    <div
      className={classes.Device}
      data-kind={spec.kind}
      data-component="Shell.Device"
      style={{ width: spec.width }}
    >
      <div className={classes.Bar}>
        {spec.kind === "window" ? (
          <span className={classes.Lights} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : null}
        <span className={classes.Address}>
          <Icon name="lock" size="xs" aria-hidden="true" />
          <span>{url}</span>
        </span>
        {spec.kind === "window" ? (
          <span className={classes.Lights} aria-hidden="true" />
        ) : null}
      </div>
      <div
        className={classes.Viewport}
        style={{ width: spec.width, height: spec.height }}
      >
        <ScreenWidth.Provider value={spec.width}>
          <ScreenScrolls.Provider value>{children}</ScreenScrolls.Provider>
        </ScreenWidth.Provider>
      </div>
    </div>
  );
  // A screen with an id is a frame's, and is selected as a frame is: by its name, which is how the pane comes back to choose another device.
  if (id === undefined || !canvas) return screen;
  return (
    <div className={classes.Wrap} data-selected={selected ? "" : undefined}>
      <button type="button" className={classes.Label} aria-pressed={selected} onClick={() => canvas.select(selected ? null : id)}>
        {name ?? spec.label}
      </button>
      {screen}
    </div>
  );
}
