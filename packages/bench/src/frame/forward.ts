/**
 * An iframe takes the wheel, the keys and the pointer for itself, so the canvas it is on stops hearing them: it could no longer be zoomed or moved
 * from where a frame is. This hands what the canvas listens for to the canvas, as if it had happened on the iframe, which is in the canvas's own
 * document: the wheel (with the pointer's place made the canvas's: the page is drawn at the canvas's scale, so a point in it is that much
 * further from the frame's corner on screen) and Space (which makes the canvas move on a drag). It is the same origin, so it is done from here.
 * Returns what takes it back.
 */
export function forwardGestures(frame: HTMLIFrameElement): () => void {
  const page = frame.contentDocument;
  if (!page) return () => undefined;

  const onWheel = (event: WheelEvent) => {
    // Always the canvas's: a page that is as tall as what it draws has nothing of its own to scroll, and the browser's own zoom is not wanted.
    event.preventDefault();
    const rect = frame.getBoundingClientRect();
    const scale = frame.offsetWidth ? rect.width / frame.offsetWidth : 1;
    frame.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaMode: event.deltaMode,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        clientX: rect.left + event.clientX * scale,
        clientY: rect.top + event.clientY * scale,
      }),
    );
  };

  const editing = (target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    return Boolean(element && (element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName)));
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.code !== "Space" || editing(event.target)) return;
    // Space moves the canvas, so it does not press the control that has the focus either (as when the page is the canvas's own).
    event.preventDefault();
    frame.dispatchEvent(new KeyboardEvent(event.type, { bubbles: true, cancelable: true, code: event.code, key: event.key }));
  };

  page.addEventListener("wheel", onWheel, { passive: false });
  page.addEventListener("keydown", onKey);
  page.addEventListener("keyup", onKey);
  return () => {
    page.removeEventListener("wheel", onWheel);
    page.removeEventListener("keydown", onKey);
    page.removeEventListener("keyup", onKey);
  };
}

/**
 * A press on an empty part of the page in a frame (the page's own background, not anything drawn on it) is a press on the frame, as it is
 * where the page ends and the frame's edge begins: the page is a document of its own, so the press never reaches the frame by itself. Returns
 * what takes it back.
 */
export function forwardEmptyPress(frame: HTMLIFrameElement, onPress: () => void): () => void {
  const page = frame.contentDocument;
  if (!page) return () => undefined;
  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Element | null;
    if (target === page.documentElement || target === page.body || target?.id === "root") onPress();
  };
  page.addEventListener("pointerdown", onPointerDown);
  return () => page.removeEventListener("pointerdown", onPointerDown);
}
