import type { KeyboardEvent } from "react";

export function getEnabledMenuItems(container: HTMLElement | null): HTMLButtonElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]:not(:disabled):not([aria-disabled="true"])'
    )
  );
}

export function focusInitialMenuItem(container: HTMLElement | null) {
  const items = getEnabledMenuItems(container);
  if (!items.length) return;
  const selected = items.find((item) => item.getAttribute("aria-checked") === "true");
  (selected ?? items[0]).focus();
}

export function handleMenuListKeyDown(
  event: KeyboardEvent<HTMLElement>,
  container: HTMLElement | null
) {
  const items = getEnabledMenuItems(container);
  if (!items.length) return;

  const active = document.activeElement as HTMLButtonElement | null;
  const index = active ? items.indexOf(active) : -1;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
      break;
    case "ArrowUp":
      event.preventDefault();
      items[index <= 0 ? items.length - 1 : index - 1]?.focus();
      break;
    case "Home":
      event.preventDefault();
      items[0]?.focus();
      break;
    case "End":
      event.preventDefault();
      items[items.length - 1]?.focus();
      break;
  }
}
