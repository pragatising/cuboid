import { useEffect, useState, type RefObject } from "react";
import { EMBED_AUTO_MAX_HEIGHT_PX } from "./frameSize";

/** The iframe's document, or null when cross-origin (access is blocked). */
function readContentDocument(iframe: HTMLIFrameElement): Document | null {
  try {
    return iframe.contentDocument;
  } catch {
    return null;
  }
}

/** Content height of a same-origin iframe, tracked as it changes; null when unmeasurable. */
export function useMeasuredHeight(iframeRef: RefObject<HTMLIFrameElement | null>, enabled: boolean, src: string | undefined): number | null {
  // Keyed by src so a measurement never outlives the page it was taken from.
  const [measured, setMeasured] = useState<{ src: string; height: number } | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!enabled || !iframe || !src) return;

    let observer: ResizeObserver | null = null;

    function attach() {
      observer?.disconnect();
      const doc = readContentDocument(iframe!);
      const view = doc?.defaultView;
      const body = doc?.body;
      if (!view || !body) return;

      // Measure the body's children, not the document: preview shells stretch html/body to the viewport,
      // which would just echo the iframe's current height back.
      const measure = () => {
        const bottoms = Array.from(body.children).map((child) => child.getBoundingClientRect().bottom);
        const next = Math.ceil(Math.max(0, ...bottoms) + view.scrollY);
        if (next > 0) setMeasured({ src: src!, height: Math.min(next, EMBED_AUTO_MAX_HEIGHT_PX) });
      };
      // The iframe's own ResizeObserver: its elements belong to its realm.
      observer = new view.ResizeObserver(measure);
      for (const child of Array.from(body.children)) observer.observe(child);
      measure();
    }

    iframe.addEventListener("load", attach);
    attach();
    return () => {
      iframe.removeEventListener("load", attach);
      observer?.disconnect();
    };
  }, [iframeRef, enabled, src]);

  return enabled && measured && measured.src === src ? measured.height : null;
}
