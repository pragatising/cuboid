import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  CSSProperties,
} from "react";
import { CanvasContext, HandleRegistry, HandlePos } from "./context";

export interface GraphCanvasProps {
  children?: React.ReactNode;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  /** Initial zoom level. Default 1. */
  defaultZoom?: number;
  /** Initial pan offset. Default { x: 0, y: 0 }. */
  defaultPan?: { x: number; y: number };
  style?: CSSProperties;
}

export function GraphCanvas({
  children,
  width = "100%",
  height = "100%",
  defaultZoom = 1,
  defaultPan = { x: 0, y: 0 },
  style,
}: GraphCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Pan / zoom state ───────────────────────────────────────────────────────
  const [panX, setPanX] = useState(defaultPan.x);
  const [panY, setPanY] = useState(defaultPan.y);
  const [zoom, setZoom] = useState(defaultZoom);

  // Refs so event handlers always read current values without re-binding
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const zoomRef = useRef(zoom);
  panXRef.current = panX;
  panYRef.current = panY;
  zoomRef.current = zoom;

  // ── Pan via mouse drag ─────────────────────────────────────────────────────
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on direct canvas click (not on cards/handles)
    if (e.target !== e.currentTarget) return;
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPanX(prev => prev + dx);
    setPanY(prev => prev + dy);
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Zoom toward cursor via wheel ───────────────────────────────────────────
  // Must be non-passive to call preventDefault and stop page scroll.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();

      // ctrlKey is set by the browser for pinch-to-zoom trackpad gestures.
      // Regular two-finger scroll has ctrlKey = false → pan the canvas.
      if (!e.ctrlKey) {
        setPanX(x => x - e.deltaX);
        setPanY(y => y - e.deltaY);
        return;
      }

      // Pinch-to-zoom (or Ctrl + scroll wheel): zoom toward the cursor.
      // Scale factor proportional to how hard the user scrolled, capped so a
      // single event can never jump more than ±10%. Trackpad pinch deltas land
      // around |deltaY| = 3–10, mouse wheel clicks around 100–120.
      const intensity = Math.min(Math.abs(e.deltaY) / 100, 1);
      const step      = 0.08 * intensity + 0.02;  // 2% – 10% per event
      const factor    = e.deltaY < 0 ? 1 + step : 1 - step;
      const rect = el!.getBoundingClientRect();

      // Cursor in viewport space
      const cursorVpX = e.clientX - rect.left;
      const cursorVpY = e.clientY - rect.top;

      // Cursor in canvas space (before zoom change)
      const cursorCvX = (cursorVpX - panXRef.current) / zoomRef.current;
      const cursorCvY = (cursorVpY - panYRef.current) / zoomRef.current;

      const newZoom = Math.max(0.05, Math.min(4, zoomRef.current * factor));

      // Adjust pan so the cursor stays over the same canvas point
      const newPanX = cursorVpX - cursorCvX * newZoom;
      const newPanY = cursorVpY - cursorCvY * newZoom;

      setZoom(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── Handle registry ────────────────────────────────────────────────────────
  const [handles, setHandles] = useState<HandleRegistry>({});

  const registerHandle = useCallback((key: string, pos: HandlePos) => {
    setHandles(prev => ({ ...prev, [key]: pos }));
  }, []);

  const unregisterHandle = useCallback((key: string) => {
    setHandles(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <CanvasContext.Provider
      value={{ viewportRef, svgRef, panX, panY, zoom, handles, registerHandle, unregisterHandle }}
    >
      {/* Viewport — clips everything, captures mouse events */}
      <div
        ref={viewportRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          position: "relative",
          overflow: "hidden",
          width,
          height,
          cursor: isDragging.current ? "grabbing" : "grab",
          userSelect: "none",
          ...style,
        }}
      >
        {/*
          SVG edge layer — sits in VIEWPORT space (outside the canvas transform),
          covering the full viewport at 100%×100%.

          Rendered FIRST so it sits behind cards and handles in z-order.
          Edges are drawn below handle dots.

          Handles register their positions in canvas space. GraphEdge converts
          them to viewport space before drawing:
            vpX = canvasX * zoom + panX
            vpY = canvasY * zoom + panY
        */}
        <svg
          ref={svgRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
          }}
        />

        {/* Canvas — transforms with pan + zoom. Cards live here. Rendered after SVG so handles sit above edges. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transformOrigin: "0 0",
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          }}
        >
          {children}
        </div>
      </div>
    </CanvasContext.Provider>
  );
}
