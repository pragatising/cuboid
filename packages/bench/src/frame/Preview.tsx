import React, { useEffect, useRef, useState } from "react";
import { forwardEmptyPress, forwardGestures } from "./forward";
import type { Value } from "../engine/types";
import type { FrameWindow, Shown } from "./protocol";
import { useScreenScrolls } from "./screen";

/** Where the page that goes in the frame is served (`document/index.html`, a second entry of Bench's build). */
const PAGE = `${import.meta.env.BASE_URL}frame/document/index.html`;

/**
 * A page of the library, in an iframe: it has its own document, so its tokens, its mode and its CSS are its own, and a width given to it is
 * a viewport (a media query sees it). It is as wide as its container (the `Frame` or the device it is in) and as tall as what it draws, so
 * the canvas scrolls it as it would a picture, not the frame inside it. In a frame the page has no scrollbars of its own, whatever it holds;
 * on a device it scrolls as a page does.
 */
/** A page that has loaded in a frame: its iframe and its document (a page that loads again is a new document). */
export type LoadedPage = { frame: HTMLIFrameElement; document: Document };

export function Preview({
  content,
  title,
  edits,
  onEmptyPress,
  onPage,
  minHeight = 80,
}: {
  content: Shown | null;
  title: string;
  /** What the pane changed on instances of an authored example, each by where it is written (`"line:column"`): the example is drawn again with it, and only the element at that place changes. */
  edits?: Record<string, Record<string, Value | undefined>>;
  /** Told when a press lands on an empty part of the page, not on anything drawn in it: the press that would select the frame the page is in. */
  onEmptyPress?: () => void;
  /** Told each time the page has loaded, with the page, and with null when it goes: whoever inspects what is drawn in it reads its document directly (the same origin). */
  onPage?: (page: LoadedPage | null) => void;
  /** The least height of the frame, for a page whose popups must open inside it (they are drawn in the page, and a page is as tall as what it draws). @default 80 */
  minHeight?: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);
  // How many times the page has loaded (it loads again when its code changes): each time it has to be told what to draw.
  const [loads, setLoads] = useState(0);
  const ready = loads > 0;
  // On a device the page scrolls as a page does; in a frame it never does (the frame clips it).
  const scrolls = useScreenScrolls();

  useEffect(() => {
    const root = frame.current?.contentDocument?.documentElement;
    if (ready && root) root.style.overflow = scrolls ? "" : "hidden";
  }, [ready, loads, scrolls]);

  // The page is ready when it has put itself on its window: its script runs before the frame's load event.
  useEffect(() => {
    if (ready) (frame.current?.contentWindow as FrameWindow | null)?.Bench?.show(content);
  }, [ready, loads, content]);

  // What the pane changed goes to the page as it changes, each on the instance it is for, by where that element is written: the example keeps running (and keeps
  // its own state) and is drawn again with it, not loaded again.
  useEffect(() => {
    if (ready) (frame.current?.contentWindow as FrameWindow | null)?.Bench?.edit(edits ?? {});
  }, [ready, loads, edits]);

  const told = useRef(onPage);
  told.current = onPage;
  useEffect(() => {
    const element = frame.current;
    if (loads === 0 || !element?.contentDocument) return;
    told.current?.({ frame: element, document: element.contentDocument });
    return () => told.current?.(null);
  }, [loads]);

  // The canvas keeps hearing the wheel and Space, which the page takes for itself (and a page that loads again is a new document).
  useEffect(() => (loads > 0 && frame.current ? forwardGestures(frame.current) : undefined), [loads]);

  // A press on the page's empty parts is the frame's: the page is a document of its own, so it is handed on.
  const press = useRef(onEmptyPress);
  press.current = onEmptyPress;
  const hears = onEmptyPress !== undefined;
  useEffect(() => (loads > 0 && hears && frame.current ? forwardEmptyPress(frame.current, () => press.current?.()) : undefined), [loads, hears]);

  // As tall as what is drawn: observed from here, on the page's own root (it is the same origin).
  useEffect(() => {
    const root = frame.current?.contentDocument?.documentElement;
    if (!ready || !root || typeof ResizeObserver === "undefined") return;
    const measure = () => setHeight(Math.ceil(root.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [ready, loads]);

  return (
    <iframe
      ref={frame}
      src={PAGE}
      title={title}
      onLoad={() => setLoads((count) => count + 1)}
      data-component="Shell.Preview"
      style={{ display: "block", width: "100%", height: height || undefined, minHeight, border: 0, background: "transparent" }}
    />
  );
}
