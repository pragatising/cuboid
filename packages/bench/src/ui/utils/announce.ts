let region: HTMLElement | null = null;

/**
 * Announce `message` to screen readers through one shared, visually hidden polite live region
 * (appended to `document.body` on first use). For status changes that have no visible text of
 * their own, e.g. a button entering its loading state. Does nothing on the server.
 *
 * The region is cleared first so announcing the same message twice still reads out twice.
 */
export function announce(message: string): void {
  if (typeof document === "undefined" || !message) return;

  if (!region || !region.isConnected) {
    region = document.createElement("div");
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.setAttribute("data-component", "LiveRegion");
    Object.assign(region.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      margin: "-1px",
      padding: "0",
      overflow: "hidden",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
      border: "0",
    });
    document.body.appendChild(region);
  }

  const target = region;
  target.textContent = "";
  setTimeout(() => {
    target.textContent = message;
  }, 100);
}
