import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { lengthToPx } from "../../../utils/length";
import { mergeProps } from "../../../utils/mergeProps";
import { Overlay } from "../Overlay";
import { ResizeHandle } from "../ResizeHandle";
import classes from "./Sheet.module.css";

export type SheetEdge = "left" | "right" | "bottom";
/** A key of `tokens.sheet.sizes.width`. */
export type SheetWidthStop = keyof Tokens["sheet"]["sizes"]["width"];
/** Named stop (`sm` / `md` / `lg`) or any CSS length (e.g. `28rem`). Ignored for `edge="bottom"`. */
export type SheetWidth = SheetWidthStop | (string & {});

export type SheetProps = Omit<React.ComponentPropsWithRef<"div">, "role"> & {
  /** When false, nothing is rendered. @default false */
  open?: boolean;
  /** Which viewport edge the panel slides from. @default "right" */
  edge?: SheetEdge;
  /** Panel width for left/right sheets: token stop or CSS length. @default "md" */
  width?: SheetWidth;
  /** Drag the inner edge to resize (left/right only). @default false */
  resizable?: boolean;
  /** Fired while resizing with the current width in px. */
  onWidthChange?: (widthPx: number) => void;
  /** When true, renders a sheet-variant Overlay scrim behind the panel and locks page scroll. @default true */
  modal?: boolean;
  /** Called when Escape is pressed or the scrim is clicked (when modal). */
  onDismiss?: () => void;
  /**
   * Rounds the top corners when `edge="bottom"`. Ignored for left/right sheets.
   * @default true
   */
  roundedTop?: boolean;
};

export type SheetRegionProps = React.ComponentPropsWithRef<"div">;

const WIDTH_STOPS: SheetWidthStop[] = ["sm", "md", "lg"];

function isWidthStop(value: SheetWidth): value is SheetWidthStop {
  return WIDTH_STOPS.includes(value as SheetWidthStop);
}

function resolveSheetWidthCss(width: SheetWidth, stops: Tokens["sheet"]["sizes"]["width"]): string {
  if (isWidthStop(width)) return stops[width];
  return width;
}

function SheetHeader({ className, ...props }: SheetRegionProps) {
  const { sheet } = useTokens();
  return (
    <div
      {...mergeProps(
        {
          "data-component": "Sheet.Header",
          className: clsx(classes.Header, className),
          style: { gap: sheet.sizes.padding, padding: sheet.sizes.padding },
        },
        props,
      )}
    />
  );
}

function SheetBody({ className, ...props }: SheetRegionProps) {
  const { sheet } = useTokens();
  return (
    <div
      {...mergeProps(
        {
          "data-component": "Sheet.Body",
          className: clsx(classes.Body, className),
          style: { paddingInline: sheet.sizes.padding, paddingBlockEnd: sheet.sizes.padding },
        },
        props,
      )}
    />
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
  className,
  children,
  ...props
}: SheetProps) {
  const { sheet, shadow, zIndex } = useTokens();
  const layout = sheet.sizes;
  const isHorizontalPanel = edge === "left" || edge === "right";

  const defaultWidthCss = useMemo(() => resolveSheetWidthCss(width, layout.width), [width, layout.width]);

  const minWidthPx = useMemo(() => lengthToPx(layout.minWidth, 240), [layout.minWidth]);
  const maxWidthPx = useMemo(() => lengthToPx(layout.maxWidth, window.innerWidth), [layout.maxWidth]);

  const [widthPx, setWidthPx] = useState(() => lengthToPx(defaultWidthCss, 400));

  useEffect(() => {
    if (open && isHorizontalPanel) {
      setWidthPx(lengthToPx(defaultWidthCss, 400));
    }
  }, [open, defaultWidthCss, isHorizontalPanel]);

  const clampWidth = useCallback(
    (next: number) => Math.min(maxWidthPx, Math.max(minWidthPx, next)),
    [maxWidthPx, minWidthPx],
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
    [clampWidth, edge, isHorizontalPanel, onWidthChange],
  );

  // A modal sheet's Overlay already dismisses on Escape; listening here too would fire onDismiss twice.
  useEffect(() => {
    if (!open || !onDismiss || modal) return;
    const dismiss = onDismiss;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss, modal]);

  useEffect(() => {
    if (!open || !modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, modal]);

  if (!open || typeof document === "undefined") return null;

  const panelWidthStyle: React.CSSProperties = isHorizontalPanel
    ? { width: resizable ? `${widthPx}px` : defaultWidthCss, maxWidth: layout.maxWidth }
    : { maxHeight: layout.maxHeight };

  return createPortal(
    <>
      {modal && <Overlay open variant="sheet" onDismiss={onDismiss} />}
      <div
        {...mergeProps(
          {
            "data-component": "Sheet",
            "data-edge": edge,
            "data-rounded-top": edge === "bottom" && roundedTop ? "" : undefined,
            role: "dialog",
            "aria-modal": modal || undefined,
            className: clsx(classes.Sheet, className),
            style: {
              zIndex: zIndex.sheet,
              backgroundColor: sheet.color.background,
              boxShadow: shadow.floating.lg,
              ...(edge === "bottom" && roundedTop
                ? { borderRadius: `${layout.bottomCornerRadius} ${layout.bottomCornerRadius} 0 0` }
                : {}),
              ...panelWidthStyle,
            },
          },
          props,
        )}
      >
        {resizable && isHorizontalPanel && (
          <ResizeHandle
            orientation="vertical"
            edge={resizeHandleEdge(edge)}
            onResizeDelta={handleResizeDelta}
            aria-label="Resize sheet"
          />
        )}
        {children}
      </div>
    </>,
    document.body,
  );
}

Sheet.Header = SheetHeader;
Sheet.Body = SheetBody;
