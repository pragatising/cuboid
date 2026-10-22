import { useCallback, useEffect, useId, useRef } from "react";
import type React from "react";
import { useAnchoredPosition, useControllableState, useDismiss } from "../../../behaviors";
import type { AnchorPlacement } from "../../../behaviors";
import { getTabbableElements } from "../../../behaviors";

export type UsePopoverOptions = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement: AnchorPlacement;
  /** Gap between the trigger and the panel, in px. */
  gap: number;
  /** Close on Escape and on a press outside the panel and its trigger. */
  dismissible: boolean;
  /** Give focus back to the trigger when the panel closes. */
  returnFocus: boolean;
  /** Move focus into the panel when it opens: its first tabbable element, or the panel itself. */
  autoFocus: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  panelRef: React.RefObject<HTMLElement | null>;
};

/**
 * The behavior of a non-modal anchored overlay (docs/behaviours.md: a component behavior returns props objects to spread):
 *
 * - `open` / `defaultOpen` / `onOpenChange` through `useControllableState`; the trigger toggles it.
 * - Placed against the trigger and kept there on scroll and resize (`useAnchoredPosition`).
 * - Dismissed by Escape (only if it is the top-most layer) and by a press outside (`useDismiss`).
 * - Focus moves into the panel when it opens, and returns to the trigger when it closes, so a keyboard user is neither
 *   stranded at the trigger (the panel is portaled to the end of the page) nor dropped at the top of the page.
 *
 * Returns `triggerProps` for the trigger, the panel's `id` and `style`, and `open` / `setOpen`.
 */
export function usePopover({ open: openProp, defaultOpen = false, onOpenChange, placement, gap, dismissible, returnFocus, autoFocus, triggerRef, panelRef }: UsePopoverOptions) {
  const panelId = useId();
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange, name: "open" });

  const { style } = useAnchoredPosition({ anchorRef: triggerRef, placement, gap, enabled: open });
  useDismiss({ enabled: open && dismissible, onDismiss: () => setOpen(false), refs: [triggerRef, panelRef] });

  useEffect(() => {
    if (!open || !autoFocus) return;
    const panel = panelRef.current;
    if (!panel) return;
    (getTabbableElements(panel)[0] ?? panel).focus({ preventScroll: true });
  }, [open, autoFocus, panelRef]);

  // Back to the trigger, unless the user has moved on to something else on purpose.
  const options = useRef({ returnFocus });
  options.current = { returnFocus };
  useEffect(() => {
    if (!open) return;
    return () => {
      if (!options.current.returnFocus) return;
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected;
      const inside = Boolean(active && panelRef.current?.contains(active));
      if (lost || inside) triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open, panelRef, triggerRef]);

  const toggle = useCallback(() => setOpen((previous) => !previous), [setOpen]);

  return { open, setOpen, panelId, style, toggle };
}
