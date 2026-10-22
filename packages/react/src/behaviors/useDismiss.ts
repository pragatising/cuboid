import type React from "react";
import { useClickAway } from "./useClickAway";
import { useEscape } from "./useEscape";

export type DismissOptions = {
  enabled: boolean;
  onDismiss: () => void;
  /** The elements that count as "inside": the floating panel and what opened it. */
  refs: React.RefObject<Element | null> | readonly React.RefObject<Element | null>[];
  /** Dismiss on Escape. @default true */
  escape?: boolean;
  /** Dismiss on a press outside `refs`. @default true */
  clickAway?: boolean;
};

/** The two ways a floating layer goes away by itself: Escape (the top-most layer only) and a press outside it. */
export function useDismiss({ enabled, onDismiss, refs, escape = true, clickAway = true }: DismissOptions) {
  useEscape(onDismiss, enabled && escape);
  useClickAway(refs, onDismiss, enabled && clickAway);
}
