import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, SheetWidthStopTokens, ThemeTokens } from "../../../theme/types";
import { parseLengthPx } from "../../../utils/parseLengthPx";
import { Overlay } from "../Overlay";
import { ResizeHandle } from "../ResizeHandle";
import styles from "./Sheet.module.css";

export type SheetEdge = "left" | "right" | "bottom";
export type SheetWidthStop = keyof SheetWidthStopTokens;
/** Named stop (`sm` / `md` / `lg`) or any CSS length (e.g. `28rem`). Ignored for `edge="bottom"`. */
export type SheetWidth = SheetWidthStop | (string & {});

export interface SheetProps {
  /** When false, nothing is rendered. */
  open?: boolean;
  /** Which viewport edge the panel slides from. */
  edge?: SheetEdge;
  /** Panel width for left/right sheets — token stop or CSS length. @default "md" */
  width?: SheetWidth;
  /** Drag the inner edge to resize (left/right only). */
  resizable?: boolean;
  /** Fired while resizing with the current width in px. */
  onWidthChange?: (widthPx: number) => void;
  /** When true (default), renders a sheet-variant Overlay scrim behind the panel. */
  modal?: boolean;
  /** Called when Escape is pressed or the scrim is clicked (when modal). */
  onDismiss?: () => void;
  /** Accessible name when the sheet has no visible title. */
  "aria-label"?: string;
  /** ID of the visible title element, when present. */
  "aria-labelledby"?: string;
  /**
   * Rounds the top corners when `edge="bottom"`. Ignored for left/right sheets.
   * @default true
   */
  roundedTop?: boolean;
  theme?: CubeTheme;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export interface SheetRegionProps {
  theme?: CubeTheme;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

const WIDTH_STOPS: SheetWidthStop[] = ["sm", "md", "lg"];

function isWidthStop(value: SheetWidth): value is SheetWidthStop {
  return WIDTH_STOPS.includes(value as SheetWidthStop);
}

function resolveSheetWidthCss(width: SheetWidth, stops: SheetWidthStopTokens): string {
  if (isWidthStop(width)) return stops[width];
  return width;
}

function sheetCssVars(tokens: ThemeTokens): Record<string, string> {
  const { sheet } = tokens.colors.functional;
  const layout = tokens.sizes.sheet;
  return {
    "--cube-sheet-bg": sheet.background,
    "--cube-sheet-maxWidth": layout.maxWidth,
    "--cube-sheet-maxHeight": layout.maxHeight,
    "--cube-sheet-padding": layout.padding,
    "--cube-sheet-bottomCornerRadius": layout.bottomCornerRadius,
    "--cube-shadow-sheet": tokens.shadows.sheet,
    "--cube-z-index-sheet": tokens.sizes.zIndex.sheet,
  };
}

function regionInlineVars(theme: CubeTheme | undefined, tokens: ThemeTokens) {
  return theme ? (sheetCssVars(tokens) as React.CSSProperties) : undefined;
}

function SheetHeader({ theme, className, style, children }: SheetRegionProps) {
  const tokens = useTheme(theme);
  return (
    <div
      className={[styles.Sheet__header, className].filter(Boolean).join(" ")}
      style={{ ...regionInlineVars(theme, tokens), ...style }}
    >
      {children}
    </div>
  );
}

function SheetBody({ theme, className, style, children }: SheetRegionProps) {
  const tokens = useTheme(theme);
  return (
    <div
      className={[styles.Sheet__body, className].filter(Boolean).join(" ")}
      style={{ ...regionInlineVars(theme, tokens), ...style }}
    >
      {children}
    </div>
  );
}

function resizeHandleEdge(edge: SheetEdge): "start" | "end" {
  return edge === "right" ? "start" : "end";
}

function applyWidthDelta(panelEdge: SheetEdge, currentPx: number, deltaPx: number): number {
  if (panelEdge === "right") return currentPx - deltaPx;
  return currentPx + deltaPx;
}

/**
 * Portaled slide-in panel — the content layer above {@link Overlay}.
 *
 * Shell has no padding — use {@link Sheet.Header} and {@link Sheet.Body}.
 * {@link ResizeHandle} is shared with Sidebar and other resizable panels.
 */
export function Sheet({
  open = false,
  edge = "right",
  width = "md",
  resizable = false,
  onWidthChange,
  modal = true,
  roundedTop = true,
  onDismiss,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  theme,
  className,
  style,
  children,
}: SheetProps) {
  const tokens = useTheme(theme);
  const layout = tokens.sizes.sheet;
  const isHorizontalPanel = edge === "left" || edge === "right";

  const defaultWidthCss = useMemo(
    () => resolveSheetWidthCss(width, layout.width),
    [width, layout.width]
  );

  const minWidthPx = useMemo(() => parseLengthPx(layout.minWidth, 240), [layout.minWidth]);
  const maxWidthPx = useMemo(
    () => parseLengthPx(layout.maxWidth, window.innerWidth),
    [layout.maxWidth]
  );

  const [widthPx, setWidthPx] = useState(() => parseLengthPx(defaultWidthCss, 400));

  useEffect(() => {
    if (open && isHorizontalPanel) {
      setWidthPx(parseLengthPx(defaultWidthCss, 400));
    }
  }, [open, defaultWidthCss, isHorizontalPanel]);

  const inlineVars = theme ? (sheetCssVars(tokens) as React.CSSProperties) : undefined;

  const clampWidth = useCallback(
    (next: number) => Math.min(maxWidthPx, Math.max(minWidthPx, next)),
    [maxWidthPx, minWidthPx]
  );

  const handleResizeDelta = useCallback(
    (deltaPx: number) => {
      if (!isHorizontalPanel) return;
      setWidthPx((current) => {
        const next = clampWidth(applyWidthDelta(edge, current, deltaPx));
        onWidthChange?.(next);
        return next;
      });
    },
    [clampWidth, edge, isHorizontalPanel, onWidthChange]
  );

  useEffect(() => {
    if (!open || !onDismiss) return;
    const dismiss = onDismiss;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);

  useEffect(() => {
    if (!open || !modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, modal]);

  if (!open || typeof document === "undefined") return null;

  const panelWidthStyle: CSSProperties = isHorizontalPanel
    ? resizable
      ? { width: `${widthPx}px`, maxWidth: layout.maxWidth }
      : { width: resolveSheetWidthCss(width, layout.width), maxWidth: layout.maxWidth }
    : {};

  const classNames = [
    styles.Sheet,
    styles[`Sheet--${edge}`],
    edge === "bottom" && roundedTop ? styles["Sheet--roundedTop"] : null,
    resizable && isHorizontalPanel ? styles["Sheet--resizable"] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <>
      {modal && (
        <Overlay open variant="sheet" onDismiss={onDismiss} theme={theme} />
      )}
      <div
        role="dialog"
        aria-modal={modal || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={classNames}
        style={{ ...inlineVars, ...panelWidthStyle, ...style }}
      >
        {resizable && isHorizontalPanel && (
          <ResizeHandle
            orientation="vertical"
            edge={resizeHandleEdge(edge)}
            onResizeDelta={handleResizeDelta}
            aria-label="Resize sheet"
            theme={theme}
          />
        )}
        {children}
      </div>
    </>,
    document.body
  );
}

Sheet.Header = SheetHeader;
Sheet.Body = SheetBody;
