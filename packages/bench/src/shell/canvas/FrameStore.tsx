import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { DeviceId } from "./Device";

export type FrameSize = { width: number; height: number };

type Frames = {
  /** The screen a frame shows its example on: "none" is a frame that fits its example, or has the width it was dragged to. */
  deviceOf: (id: string) => DeviceId;
  setDevice: (id: string, device: DeviceId) => void;
  /** The screen a frame starts on, as its example says: used until a viewer chooses another. */
  startOn: (id: string, device: DeviceId) => void;
  /** How big the frame is now, as it reports it (on a device, the screen's size), or nothing before it has been drawn. */
  sizeOf: (id: string) => FrameSize | undefined;
  report: (id: string, size: FrameSize) => void;
};

const Context = createContext<Frames | null>(null);

/**
 * What the canvas's frames and the right pane share: each frame's device (a viewer's choice, made in the pane for the frame selected, not
 * for the whole canvas) and the size each reports as it is dragged. It holds nothing the code could say: both are about how the example is
 * looked at, not what it is. It belongs to one canvas: another component or view is another one.
 */
export function FramesProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Record<string, DeviceId>>({});
  const [starts, setStarts] = useState<Record<string, DeviceId>>({});
  const [sizes, setSizes] = useState<Record<string, FrameSize>>({});
  const setDevice = useCallback((id: string, device: DeviceId) => setDevices((all) => ({ ...all, [id]: device })), []);
  const startOn = useCallback((id: string, device: DeviceId) => setStarts((all) => (all[id] === device ? all : { ...all, [id]: device })), []);
  // A frame reports on every resize it observes: one that did not change is not a change.
  const report = useCallback(
    (id: string, size: FrameSize) =>
      setSizes((all) => (all[id]?.width === size.width && all[id]?.height === size.height ? all : { ...all, [id]: size })),
    [],
  );
  const value = useMemo<Frames>(
    () => ({ deviceOf: (id) => devices[id] ?? starts[id] ?? "none", setDevice, startOn, sizeOf: (id) => sizes[id], report }),
    [devices, starts, sizes, setDevice, startOn, report],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** The frames' shared state, or null outside a canvas that keeps it (a frame then has no device of its own to choose). */
export const useFrames = () => useContext(Context);
