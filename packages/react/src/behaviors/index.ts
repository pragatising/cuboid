// Generic behaviors (docs/behaviours.md): low-level hooks with no knowledge of any one component. They depend only on each
// other. Component behaviors (usePopover, useActionMenu…) are built from these and live next to their component.
export { useControllableState } from "./useControllableState";
export type { ControllableStateOptions } from "./useControllableState";
export { useProvidedRefOrCreate } from "./useProvidedRefOrCreate";
export { useEscape } from "./useEscape";
export { useClickAway } from "./useClickAway";
export { useDismiss } from "./useDismiss";
export type { DismissOptions } from "./useDismiss";
export { useAnchoredPosition, computeAnchoredPosition } from "./useAnchoredPosition";
export type { AnchorPlacement, AnchoredPositionOptions } from "./useAnchoredPosition";
export { useResizable } from "./useResizable";
export type { ResizableOptions } from "./useResizable";
export { useFocusReturn } from "./useFocusReturn";
export type { FocusReturnOptions } from "./useFocusReturn";
export { useFocusTrap } from "./useFocusTrap";
export type { FocusTrapOptions } from "./useFocusTrap";
export { useScrollLock } from "./useScrollLock";
export { usePlatform, PlatformProvider } from "./usePlatform";
export type { Platform } from "./usePlatform";
export { useRovingFocus } from "./useRovingFocus";
export type { RovingFocusOptions } from "./useRovingFocus";
export { getTabbableElements, isTabbable } from "./tabbable";
