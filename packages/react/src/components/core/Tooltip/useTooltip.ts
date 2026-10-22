import { useCallback, useEffect, useId, useRef, useState } from "react";
import type React from "react";
import { useAnchoredPosition, useEscape } from "../../../behaviors";
import type { AnchorPlacement } from "../../../behaviors";
import { useTokens } from "../../../mode";
import { lengthToPx } from "../../../utils/length";

/** `label` names the trigger (an icon-only button); `description` adds supplementary information to a trigger that has a name. */
export type TooltipType = "label" | "description";
/** How long the pointer must rest on the trigger before the tooltip shows (the `tooltip.delay` tokens). */
export type TooltipDelay = "short" | "medium" | "long";

export type UseTooltipOptions = {
  /** The id the trigger refers to (`aria-labelledby` / `aria-describedby`). Generated when not given. */
  id?: string;
  placement: AnchorPlacement;
  delay: TooltipDelay;
  /** Keep the tooltip from opening, and close it if it is open: while the trigger's menu is open, say. */
  suppress: boolean;
  /** The trigger element the tooltip is placed against. */
  triggerRef: React.RefObject<HTMLElement | null>;
};

/** Keyboard focus shows a tooltip; a mouse click that happens to focus the trigger does not. jsdom has no `:focus-visible`, so it counts as visible there. */
function isFocusVisible(target: EventTarget): boolean {
  try {
    return (target as Element).matches(":focus-visible");
  } catch {
    return true;
  }
}

/**
 * The behavior of a tooltip (docs/behaviours.md: a component behavior returns props objects to spread):
 *
 * - **Hover** shows it after `delay` (so a pointer passing through shows nothing), and hides it when the pointer leaves, after
 *   a short grace period that lets the pointer cross onto the tooltip itself: it stays open while hovered (WCAG 1.4.13).
 * - **Keyboard focus** (`:focus-visible` only) shows it at once; blur hides it.
 * - **Escape** hides it, answered only if this is the top-most layer (it is above a popover it was opened in).
 * - **Touch**: a tap hides it, so it does not linger on a touch screen.
 *
 * Returns `triggerProps` for the trigger, `panelProps` for the tooltip element, `style` (its `position: fixed` coordinates) and `open`.
 */
export function useTooltip({ id, placement, delay, suppress, triggerRef }: UseTooltipOptions) {
  const generated = useId();
  const tooltipId = id ?? generated;
  const { tooltip, motion } = useTokens();
  const delayMs = tooltip.delay[delay].value;
  const graceMs = motion.duration.micro.value;

  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const timers = useRef<{ show?: ReturnType<typeof setTimeout>; hide?: ReturnType<typeof setTimeout> }>({});

  const clearTimers = useCallback(() => {
    clearTimeout(timers.current.show);
    clearTimeout(timers.current.hide);
    timers.current = {};
  }, []);

  const show = useCallback(() => {
    clearTimers();
    openRef.current = true;
    setOpen(true);
  }, [clearTimers]);

  const hide = useCallback(() => {
    clearTimers();
    openRef.current = false;
    setOpen(false);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);
  useEffect(() => {
    if (suppress) hide();
  }, [suppress, hide]);

  const { style } = useAnchoredPosition({ anchorRef: triggerRef, placement, gap: lengthToPx(tooltip.sizes.gap, 2), enabled: open });
  useEscape(hide, open);

  const triggerProps = {
    onFocus: (event: React.FocusEvent) => {
      if (!suppress && isFocusVisible(event.target)) show();
    },
    onBlur: () => hide(),
    onMouseEnter: () => {
      if (suppress) return;
      clearTimers();
      timers.current.show = setTimeout(show, delayMs);
    },
    onMouseLeave: () => {
      clearTimeout(timers.current.show);
      if (!openRef.current) return;
      timers.current.hide = setTimeout(hide, graceMs);
    },
    onTouchEnd: () => {
      clearTimers();
      timers.current.hide = setTimeout(hide, 10);
    },
  };

  const panelProps = {
    onMouseEnter: () => clearTimeout(timers.current.hide),
    onMouseLeave: () => hide(),
  };

  return { tooltipId, open, triggerProps, panelProps, style };
}
