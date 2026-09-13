import { createContext, useContext, RefObject } from "react";

// ── Handle registry ───────────────────────────────────────────────────────────

/** A position in canvas space (same coordinate system as card x/y props). */
export interface HandlePos {
  x: number;
  y: number;
}

/**
 * All registered handle positions keyed by "nodeId:handleId".
 * Read by GraphEdge to know where to draw bezier endpoints.
 */
export type HandleRegistry = Record<string, HandlePos>;

// ── Canvas context ────────────────────────────────────────────────────────────

export interface CanvasContextValue {
  /** Ref to the outermost viewport div — used for coordinate conversion. */
  viewportRef: RefObject<HTMLDivElement | null>;
  /** Ref to the SVG element — GraphEdge portals paths into this. */
  svgRef: RefObject<SVGSVGElement | null>;
  /** Current pan offset in pixels. */
  panX: number;
  panY: number;
  /** Current zoom level (1 = 100%). */
  zoom: number;
  /** All currently registered handle positions (canvas space). */
  handles: HandleRegistry;
  /** Called by GraphHandle on mount to publish its canvas-space position. */
  registerHandle: (key: string, pos: HandlePos) => void;
  /** Called by GraphHandle on unmount. */
  unregisterHandle: (key: string) => void;
}

export const CanvasContext = createContext<CanvasContextValue | null>(null);

export function useCanvasContext(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("Must be used inside <GraphCanvas>");
  return ctx;
}

// ── Card context ──────────────────────────────────────────────────────────────

export interface CardContextValue {
  /** The id passed to <GraphCard id="…"> */
  cardId: string;
}

export const CardContext = createContext<CardContextValue | null>(null);

export function useCardContext(): CardContextValue {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error("Must be used inside <GraphCard>");
  return ctx;
}
