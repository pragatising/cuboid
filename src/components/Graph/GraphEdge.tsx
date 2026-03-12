import { createPortal } from "react-dom";
import { useTheme } from "../../theme/ThemeContext";
import { useCanvasContext } from "./context";

export interface EdgeEndpoint {
  /** The GraphCard id. */
  node: string;
  /** The GraphHandle id within that card. */
  handle: string;
}

export interface GraphEdgeProps {
  from: EdgeEndpoint;
  to: EdgeEndpoint;
  /** Stroke colour. Default: a neutral grey. */
  color?: string;
  /** Stroke width in canvas pixels. Default 1.5. */
  strokeWidth?: number;
  /**
   * How strongly the bezier control points pull horizontally.
   * 0 = straight line. 0.5 = gentle S-curve (default). 1 = strong pull.
   */
  curvature?: number;
}

/**
 * Draws a smooth bezier curve between two GraphHandle positions.
 *
 * Renders nothing in its own DOM position — it portals a <path> element
 * directly into the GraphCanvas SVG layer so edges always render in the
 * correct coordinate space (behind cards, inside the canvas transform).
 */
export function GraphEdge({
  from,
  to,
  color,
  strokeWidth = 1,
  curvature = 0.5,
}: GraphEdgeProps) {
  const tokens = useTheme();
  const { handles, svgRef, panX, panY, zoom } = useCanvasContext();

  const fromKey = `${from.node}:${from.handle}`;
  const toKey   = `${to.node}:${to.handle}`;

  const s = handles[fromKey];
  const t = handles[toKey];

  // Wait until both handles have registered their positions
  if (!s || !t || !svgRef.current) return null;

  // Handles are stored in canvas space. The SVG lives in viewport space,
  // so convert: vpX = canvasX * zoom + panX
  const sx = s.x * zoom + panX;
  const sy = s.y * zoom + panY;
  const tx = t.x * zoom + panX;
  const ty = t.y * zoom + panY;

  // Cubic bezier: control points pull horizontally from each endpoint.
  // The pull distance scales with the horizontal gap so tight and wide
  // connections both look natural.
  const dx = Math.abs(tx - sx) * curvature;
  const d = [
    `M ${sx} ${sy}`,
    `C ${sx + dx} ${sy},`,
    `  ${tx - dx} ${ty},`,
    `  ${tx} ${ty}`,
  ].join(" ");

  return createPortal(
    <path
      d={d}
      stroke={color ?? tokens.colors.base.gray[2]}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
    />,
    svgRef.current
  );
}
