import React, { useRef, useLayoutEffect, useEffect, CSSProperties } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useCanvasContext, useCardContext } from "./context";

export type HandleSide = "left" | "right" | "top" | "bottom";

export interface GraphHandleProps {
  /** Must be unique within its card. Edge references: "cardId:handleId". */
  id: string;
  side: HandleSide;
  /**
   * Radius of the D-shape semicircle in pixels — the bump protrudes this far
   * from the card border. Default 12.
   */
  size?: number;
  /** Dot fill colour. Defaults to the theme's blue accent. */
  color?: string;
  style?: CSSProperties;
}

// ── SVG shape builders ────────────────────────────────────────────────────────

/**
 * Builds the SVG for a D-shaped handle bump.
 *
 * The flat edge of the D sits flush against the card border.
 * The arc (curved side) forms the visible bump — filled white, bordered with
 * the card border colour. The dot is centred on the flat edge, half inside the
 * D and half inside the card, making it appear circumscribed by the bump.
 *
 *   right handle:  flat edge on LEFT  → bump protrudes RIGHT
 *   left  handle:  flat edge on RIGHT → bump protrudes LEFT
 */
function HandleSvg({
  side,
  size,
  dotColor,
  bgColor,
  borderColor,
  strokeWidth,
}: {
  side: HandleSide;
  size: number;
  dotColor: string;
  bgColor: string;
  borderColor: string;
  strokeWidth: number;
}) {
  // size = radius of the D semicircle (e.g. 12px)
  // The D container is:  width=size, height=size*2  (for left/right)
  const diam = size * 2;  // full diameter = height of the D
  const dot  = 4.5;         // dot radius fixed at 6px → 12px diameter

  const isHorizontal = side === "left" || side === "right";
  const w = isHorizontal ? size : diam;
  const h = isHorizontal ? diam : size;

  let fill: string, arc: string, cx: number, cy: number;

  switch (side) {
    case "right":
      // Flat edge on left (x=0), bump curves right; arc radius = size
      fill = `M 0 0 A ${size} ${size} 0 0 1 0 ${diam} Z`;
      arc  = `M 0 0 A ${size} ${size} 0 0 1 0 ${diam}`;
      cx = 0;    cy = size;   // dot centred on flat edge (left, mid-height)
      break;

    case "left":
      // Flat edge on right (x=size), bump curves left
      fill = `M ${size} 0 A ${size} ${size} 0 0 0 ${size} ${diam} Z`;
      arc  = `M ${size} 0 A ${size} ${size} 0 0 0 ${size} ${diam}`;
      cx = size; cy = size;
      break;

    case "bottom":
      // Flat edge on top (y=0), bump curves down
      fill = `M 0 0 A ${size} ${size} 0 0 0 ${diam} 0 Z`;
      arc  = `M 0 0 A ${size} ${size} 0 0 0 ${diam} 0`;
      cx = size; cy = 0;
      break;

    case "top":
    default:
      // Flat edge on bottom (y=size), bump curves up
      fill = `M 0 ${size} A ${size} ${size} 0 0 1 ${diam} ${size} Z`;
      arc  = `M 0 ${size} A ${size} ${size} 0 0 1 ${diam} ${size}`;
      cx = size; cy = size;
      break;
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ overflow: "visible", display: "block" }}
    >
      {/* White background fills the D interior */}
      <path d={fill} fill={bgColor} stroke="none" />
      {/* Border on the curved side only — flat edge has no line */}
      <path d={arc}  fill="none"    stroke={borderColor} strokeWidth={strokeWidth} />
      {/* Dot centred on the flat edge, straddles the card border */}
      <circle cx={cx} cy={cy} r={dot} fill={dotColor} />
    </svg>
  );
}

// ── CSS positioning of the SVG element ───────────────────────────────────────
//
// We position the SVG so its flat edge aligns with the card / row border.
// translate(±100%, -50%) shifts the SVG fully outside the containing block
// so that only the flat edge touches the border.

const SVG_POSITION: Record<HandleSide, CSSProperties> = {
  right:  { position: "absolute", right: -12, top: "50%", transform: "translate(100%, -50%)" },
  left:   { position: "absolute", left:   0, top: "50%", transform: "translate(-100%, -50%)" },
  bottom: { position: "absolute", bottom: 0, left: "50%", transform: "translate(-50%, 100%)"  },
  top:    { position: "absolute", top:    0, left: "50%", transform: "translate(-50%, -100%)" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function GraphHandle({ id, side, size = 12, color, style }: GraphHandleProps) {
  const tokens = useTheme();
  const { cardId }  = useCardContext();
  const { viewportRef, panX, panY, zoom, registerHandle, unregisterHandle } =
    useCanvasContext();

  const ref  = useRef<HTMLDivElement>(null);
  const key  = `${cardId}:${id}`;

  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const zoomRef = useRef(zoom);
  panXRef.current = panX;
  panYRef.current = panY;
  zoomRef.current = zoom;

  function measure() {
    const el = ref.current;
    const vp = viewportRef.current;
    if (!el || !vp) return;

    const er = el.getBoundingClientRect();
    const vr = vp.getBoundingClientRect();

    // Connection point = centre of the flat edge of the D (= the card border)
    let vpX: number, vpY: number;
    switch (side) {
      case "right":  vpX = er.left   - vr.left; vpY = er.top + er.height / 2 - vr.top; break;
      case "left":   vpX = er.right  - vr.left; vpY = er.top + er.height / 2 - vr.top; break;
      case "bottom": vpX = er.left + er.width / 2 - vr.left; vpY = er.top    - vr.top; break;
      case "top":    vpX = er.left + er.width / 2 - vr.left; vpY = er.bottom - vr.top; break;
    }

    registerHandle(key, {
      x: (vpX - panXRef.current) / zoomRef.current,
      y: (vpY - panYRef.current) / zoomRef.current,
    });
  }

  useLayoutEffect(() => {
    measure();
    return () => unregisterHandle(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, panX, panY, zoom]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(vp);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div
      ref={ref}
      style={{ ...SVG_POSITION[side], zIndex: 10, ...style }}
    >
      <HandleSvg
        side={side}
        size={size}
        dotColor={color ?? tokens.colors.base.blue[5]}
        bgColor={tokens.colors.global.bg.gray.light["1"]}
        borderColor={tokens.colors.global.border.gray["2"]}
        strokeWidth={parseFloat(tokens.sizes.borderWidth.thin)}
      />
    </div>
  );
}
