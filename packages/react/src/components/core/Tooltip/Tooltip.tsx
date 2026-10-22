import React, { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { usePlatform } from "../../../behaviors";
import type { AnchorPlacement } from "../../../behaviors";
import { useTokens } from "../../../mode";
import type { CssColor } from "../../../utils/colorPaths";
import { cssVars } from "../../../utils/cssVars";
import { isDev } from "../../../utils/isDev";
import { mergeProps } from "../../../utils/mergeProps";
import { resolved } from "../../../utils/resolved";
import type { Length, RawLength, SpaceValue } from "../../../utils/space";
import { Box } from "../Box";
import { KeybindingHint, getAccessibleKeybindingHintString } from "../KeybindingHint";
import { VisuallyHidden } from "../VisuallyHidden";
import { TooltipContext } from "./TooltipContext";
import { useTooltip } from "./useTooltip";
import type { TooltipDelay, TooltipType } from "./useTooltip";
import classes from "./Tooltip.module.css";

/** Where the tooltip sits against its trigger: `top` / `bottom` / `left` / `right`, centred, or `*-start` / `*-end` aligned to an edge. */
export type TooltipPlacement = AnchorPlacement;
export type { TooltipType, TooltipDelay };

export type TooltipProps = Omit<React.ComponentPropsWithoutRef<"span">, "children" | "color" | "id"> & {
  /** The tooltip's text. Text only: anything interactive belongs in a `Popover`. */
  text: string;
  /**
   * `label` names the trigger (an icon-only button): the tooltip is its accessible name. `description` adds supplementary
   * information to a trigger that already has a name: it is announced as its description.
   * @default "description"
   */
  type?: TooltipType;
  /** @default "bottom" */
  placement?: TooltipPlacement;
  /** How long the pointer rests on the trigger before it shows: `short` 50ms, `medium` 400ms, `long` 1200ms (the `tooltip.delay` tokens). Keyboard focus shows it at once. @default "short" */
  delay?: TooltipDelay;
  /** A keyboard shortcut to show beside the text (`"Mod+S"`), or several (`["Mod+S", "Mod+Enter"]`, joined with "or"). Written as `KeybindingHint` takes `keys`. */
  keybindingHint?: string | readonly string[];
  /** Keep the tooltip from opening, for example while the trigger's own menu is open. @default false */
  suppress?: boolean;
  /** The id the trigger is labelled or described by. Generated when not given. */
  id?: string;
  /** The trigger: a single element that can take focus (a button, a link…) and accepts the props below and a `ref`. */
  children: React.ReactElement;
  /** Forwarded to the trigger element (merged with the trigger's own `ref`). */
  ref?: React.Ref<HTMLElement>;
};

const INTERACTIVE = 'a[href], button:not([disabled]), summary, select, input:not([type="hidden"]), textarea, [tabindex]:not([tabindex="-1"]), [role="button"]';

const assignRef = <T,>(ref: React.Ref<T> | undefined, value: T | null) => {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as React.RefObject<T | null>).current = value;
};

/**
 * A short text hint for a control. It is the trigger's accessible name (`type="label"`) or description
 * (`type="description"`, the default), so it is announced; the tooltip itself is hidden from assistive technology so it is not
 * read twice. It shows on hover (after `delay`) and on keyboard focus, stays open while the pointer is on it, and closes on
 * Escape, blur or leaving.
 *
 * There is no wrapper element: the tooltip clones its trigger to add the props it needs, and renders the tip in a portal.
 */
export function Tooltip({
  text,
  type = "description",
  placement = "bottom",
  delay = "short",
  keybindingHint,
  suppress = false,
  id,
  className,
  children,
  ref,
  ...props
}: TooltipProps) {
  const { tooltip, text: textTokens, zIndex, shadow, motion } = useTokens();
  const platform = usePlatform();
  const child = Children.only(children);
  const isFragment = isValidElement(child) && child.type === React.Fragment;
  const element = isValidElement(child) && !isFragment ? (child as React.ReactElement<Record<string, unknown> & { ref?: React.Ref<HTMLElement> }>) : null;

  const triggerRef = useRef<HTMLElement | null>(null);
  const childRef = element?.props.ref;
  const setTrigger = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      assignRef(ref, node);
      assignRef(childRef, node);
    },
    [ref, childRef],
  );

  const { tooltipId, open, triggerProps, panelProps, style } = useTooltip({ id, placement, delay, suppress, triggerRef });
  const contextValue = useMemo(() => ({ tooltipId }), [tooltipId]);

  // The tip is portaled to the body, which does not exist on the server: it appears after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isDev()) return;
    if (isFragment) console.warn("Tooltip does not support a React Fragment as its trigger. Pass a single element that can take focus.");
    const trigger = triggerRef.current;
    if (!trigger) return;
    const focusable = trigger.matches(INTERACTIVE) || trigger.querySelector(INTERACTIVE);
    if (!focusable) {
      console.warn(
        "Tooltip's trigger cannot take keyboard focus, so the tooltip cannot be reached without a mouse. Use a button or a link; for a disabled control use `inactive`, which stays focusable.",
      );
    }
    if (type === "label" && trigger.hasAttribute("aria-label")) {
      console.warn("A label Tooltip names its trigger: remove the aria-label from the trigger.");
    }
  }, [isFragment, type]);

  if (!element) return <>{children}</>;

  const hints = typeof keybindingHint === "string" ? [keybindingHint] : [...(keybindingHint ?? [])];
  const { ref: _childRef, "aria-describedby": childDescribedBy, "aria-labelledby": childLabelledBy, ...childProps } = element.props;
  const describedBy = type === "description" ? [childDescribedBy, tooltipId].filter(Boolean).join(" ") : (childDescribedBy as string | undefined);
  const labelledBy = type === "label" ? tooltipId : (childLabelledBy as string | undefined);

  const trigger = cloneElement(
    element,
    mergeProps({ ...triggerProps, ref: setTrigger, "aria-describedby": describedBy, "aria-labelledby": labelledBy }, childProps) as Record<string, unknown>,
  );

  const panel = (
    <Box
      as="span"
      {...mergeProps(
        {
          "data-component": "Tooltip",
          "data-open": open ? "" : undefined,
          "data-placement": placement,
          className: clsx(classes.Tooltip, className),
          // Only a description is a tooltip in the ARIA sense; a label is the trigger's name.
          role: type === "description" ? "tooltip" : undefined,
          // The trigger already announces it by reference; hiding it here stops a second reading.
          "aria-hidden": true,
          style: { ...style, ...cssVars("tooltip", { fade: `${motion.duration.micro.value}${motion.duration.micro.unit}` }) },
          ...panelProps,
        },
        props as object,
      )}
      display={open ? "block" : "none"}
      position="fixed"
      zIndex={zIndex.tooltip}
      width="max-content"
      maxWidth={resolved<Length>(tooltip.sizes.maxWidth)}
      backgroundColor={resolved<CssColor>(tooltip.color.background)}
      color={resolved<CssColor>(tooltip.color.foreground)}
      border={{ color: resolved<CssColor>(tooltip.color.border), width: "thin" }}
      borderRadius={resolved<RawLength>(tooltip.sizes.borderRadius)}
      paddingBlock={resolved<SpaceValue>(tooltip.sizes.paddingBlock)}
      paddingInline={resolved<SpaceValue>(tooltip.sizes.paddingInline)}
      boxShadow={tooltip.sizes.boxShadow}
      font={textTokens.size.sm}
      textAlign="center"
      whiteSpace="normal"
      overflowWrap="break-word"
      textWrap="balance"
      margin={0}
      pointerEvents="auto"
    >
      {/* The part the trigger refers to: the text, and the shortcut in words for a screen reader. */}
      <span id={tooltipId}>
        {text}
        {hints.length > 0 && <VisuallyHidden> ({hints.map((hint) => getAccessibleKeybindingHintString(hint, platform)).join(" or ")})</VisuallyHidden>}
      </span>
      {hints.length > 0 && (
        <span data-component="Tooltip.KeybindingHints" aria-hidden style={{ marginInlineStart: "0.5em" }}>
          {hints.map((hint, index) => (
            <React.Fragment key={`${index}-${hint}`}>
              {index > 0 && " or "}
              <KeybindingHint keys={hint} variant="inverted" size="sm" />
            </React.Fragment>
          ))}
        </span>
      )}
    </Box>
  );

  return (
    <TooltipContext.Provider value={contextValue}>
      {trigger}
      {mounted && createPortal(panel, document.body)}
    </TooltipContext.Provider>
  );
}
