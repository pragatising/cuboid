import React, { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useControllableState, useEscape, useFocusReturn, useFocusTrap, useProvidedRefOrCreate, useScrollLock } from "../../../behaviors";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { useAccessibleNameWarning } from "../../../utils/a11y";
import type { AccessibleName } from "../../../utils/a11y";
import { lengthToPx } from "../../../utils/length";
import { mergeProps } from "../../../utils/mergeProps";
import { resolved } from "../../../utils/resolved";
import type { Length, RawLength, SpaceValue } from "../../../utils/space";
import type { CssColor } from "../../../utils/colorPaths";
import { Box } from "../Box";
import type { BoxOwnProps } from "../Box";
import { Overlay } from "../Overlay";
import { ResizeHandle } from "../ResizeHandle";
import classes from "./Sheet.module.css";

export type SheetEdge = "left" | "right" | "bottom";
/** A key of `tokens.sheet.sizes.width`. */
export type SheetWidthStop = keyof Tokens["sheet"]["sizes"]["width"];
/** A named stop (`sm` / `md` / `lg`), a step of the Nx scale, or any CSS length (`28rem`). Ignored for `edge="bottom"`. */
export type SheetWidth = SheetWidthStop | Length;

export type SheetProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "aria-label" | "aria-labelledby"> &
  AccessibleName & {
    /** Whether the sheet is open (controlled). Leave unset to let the sheet manage it, and use `defaultOpen`. */
    open?: boolean;
    /** Whether the sheet starts open, when uncontrolled. @default false */
    defaultOpen?: boolean;
    /** Called when the sheet asks to open or close: Escape, a click on the scrim, or `Sheet.Close`-style controls inside it. */
    onOpenChange?: (open: boolean) => void;
    /** Which viewport edge the panel slides from. @default "right" */
    edge?: SheetEdge;
    /** Panel width for left/right sheets: a token stop, a step of the Nx scale, or a CSS length. @default "md" */
    width?: SheetWidth;
    /** Drag the inner edge, or use the arrow keys on it, to resize (left/right only). @default false */
    resizable?: boolean;
    /** Fired while resizing with the current width in px. */
    onWidthChange?: (widthPx: number) => void;
    /**
     * A modal sheet puts a scrim behind the panel, locks page scroll, keeps keyboard focus inside the panel and gives it
     * back on close. A non-modal one is a side panel the page stays usable beside. @default true
     */
    modal?: boolean;
    /** Rounds the top corners when `edge="bottom"`. Ignored for left/right sheets. @default true */
    roundedTop?: boolean;
  };

export type SheetRegionProps = React.ComponentPropsWithRef<"div">;

const WIDTH_STOPS: SheetWidthStop[] = ["sm", "md", "lg"];
const isWidthStop = (value: SheetWidth): value is SheetWidthStop => WIDTH_STOPS.includes(value as SheetWidthStop);

function SheetHeader({ className, ...props }: SheetRegionProps) {
  const { sheet } = useTokens();
  const padding = resolved<SpaceValue>(sheet.sizes.padding);
  return (
    <Box
      {...mergeProps({ "data-component": "Sheet.Header", className: clsx(classes.Header, className) }, props as object)}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      flexShrink={0}
      gap={padding}
      padding={padding}
    />
  );
}

function SheetBody({ className, ...props }: SheetRegionProps) {
  const { sheet } = useTokens();
  const padding = resolved<SpaceValue>(sheet.sizes.padding);
  return (
    <Box
      {...mergeProps({ "data-component": "Sheet.Body", className: clsx(classes.Body, className) }, props as object)}
      flex="1 1 auto"
      minHeight="0"
      overflow="auto"
      paddingInline={padding}
      paddingBlockEnd={padding}
    />
  );
}

/**
 * Portaled slide-in panel: the content layer above {@link Overlay}.
 *
 * The shell has no padding; use {@link Sheet.Header} and {@link Sheet.Body}. Open state is `open` / `defaultOpen` /
 * `onOpenChange`. A modal sheet traps focus, returns it on close, and locks page scroll; it needs an accessible name
 * (`aria-label` or `aria-labelledby`). {@link ResizeHandle} is shared with Sidebar and other resizable panels.
 */
export function Sheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  edge = "right",
  width = "md",
  resizable = false,
  onWidthChange,
  modal = true,
  roundedTop = true,
  className,
  children,
  ref,
  ...props
}: SheetProps) {
  const { sheet, shadow, zIndex } = useTokens();
  const layout = sheet.sizes;
  const isHorizontalPanel = edge === "left" || edge === "right";

  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange, name: "open" });
  const panelRef = useProvidedRefOrCreate<HTMLDivElement>(ref);
  useAccessibleNameWarning("Sheet", props);

  // A modal sheet's Overlay already closes on Escape; listening here too would answer twice.
  useEscape(() => setOpen(false), open && !modal);
  useFocusTrap({ enabled: open && modal, containerRef: panelRef });
  useFocusReturn({ enabled: open && !modal, containerRef: panelRef });
  useScrollLock(open && modal);

  const defaultWidth = isWidthStop(width) ? layout.width[width] : (width as string);
  const minWidthPx = lengthToPx(layout.minWidth, 240);
  const maxWidthPx = lengthToPx(layout.maxWidth, typeof window === "undefined" ? 960 : window.innerWidth);

  // The width the panel really has when it opens (a stop like `min(90vw, 56rem)` is not a plain length), so a drag or an
  // arrow key starts from what the user sees; the width they drag to is remembered until it closes.
  const [measured, setMeasured] = useState<number | null>(null);
  const [dragged, setDragged] = useState<number | null>(null);
  // Re-measured after every resize too, because CSS can cap the width below what was asked for (`max-width`); the value the
  // separator reports is then what the user sees.
  useLayoutEffect(() => {
    if (open && isHorizontalPanel) setMeasured(panelRef.current?.getBoundingClientRect().width || null);
  }, [open, isHorizontalPanel, defaultWidth, dragged, panelRef]);
  useEffect(() => {
    if (!open) setDragged(null);
  }, [open]);
  const currentPx = measured ?? dragged ?? lengthToPx(defaultWidth, 400);

  if (!open || typeof document === "undefined") return null;

  const side: Record<SheetEdge, BoxOwnProps> = {
    left: { top: 0, bottom: 0, left: 0 },
    right: { top: 0, bottom: 0, right: 0 },
    bottom: { left: 0, right: 0, bottom: 0 },
  };
  const geometry: BoxOwnProps =
    edge === "bottom"
      ? { ...side.bottom, width: "100%", maxHeight: layout.maxHeight }
      : {
          ...side[edge],
          width: resizable && dragged !== null ? `${dragged}px` : defaultWidth,
          maxWidth: layout.maxWidth,
        };

  return createPortal(
    <>
      {modal && <Overlay open variant="sheet" onDismiss={() => setOpen(false)} />}
      <Box
        {...mergeProps(
          {
            "data-component": "Sheet",
            "data-edge": edge,
            "data-rounded-top": edge === "bottom" && roundedTop ? "" : undefined,
            role: "dialog",
            "aria-modal": modal || undefined,
            className: clsx(classes.Sheet, className),
            ref: panelRef,
          },
          props as object,
        )}
        position="fixed"
        overflow="hidden"
        zIndex={zIndex.sheet}
        backgroundColor={resolved<CssColor>(sheet.color.background)}
        boxShadow={shadow.floating.lg}
        borderRadius={edge === "bottom" && roundedTop ? resolved<RawLength>(`${layout.bottomCornerRadius} ${layout.bottomCornerRadius} 0 0`) : undefined}
        {...geometry}
      >
        {resizable && isHorizontalPanel && (
          <ResizeHandle
            edge={edge === "right" ? "left" : "right"}
            value={currentPx}
            min={minWidthPx}
            max={maxWidthPx}
            onValueChange={(px) => {
              setDragged(px);
              onWidthChange?.(px);
            }}
            aria-label="Resize sheet"
          />
        )}
        {children}
      </Box>
    </>,
    document.body,
  );
}

Sheet.Header = SheetHeader;
Sheet.Body = SheetBody;
