const TABBABLE = [
  "a[href]",
  "area[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

/** Rendered at all: not `display: none` (on it or an ancestor, which `getComputedStyle` does not inherit) and not `visibility: hidden`. */
function isVisible(element: HTMLElement): boolean {
  if (typeof element.checkVisibility === "function") return element.checkVisibility({ visibilityProperty: true });
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    if (getComputedStyle(node).display === "none") return false;
  }
  return getComputedStyle(element).visibility !== "hidden";
}

/** True when the element can be reached by Tab: not disabled, not `tabindex="-1"`, not hidden or inert. */
export function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if ((element as HTMLButtonElement).disabled) return false;
  if (element instanceof HTMLInputElement && element.type === "hidden") return false;
  if (element.closest("[hidden], [inert]")) return false;
  return isVisible(element);
}

/** The elements inside `container` that Tab reaches, in DOM order. */
export function getTabbableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE)).filter(isTabbable);
}
