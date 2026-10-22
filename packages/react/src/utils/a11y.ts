import { useEffect } from "react";
import { isDev } from "./isDev";

/** A component with a role that needs a name (a dialog, a landmark, an icon-only control): exactly one of `aria-label` or `aria-labelledby`. */
export type AccessibleName =
  | { "aria-label": string; "aria-labelledby"?: undefined }
  | { "aria-label"?: undefined; "aria-labelledby": string };

/** In development, warn when a component that needs an accessible name was given neither (JavaScript callers; the type stops TypeScript ones). */
export function useAccessibleNameWarning(component: string, props: { "aria-label"?: string; "aria-labelledby"?: string }) {
  const named = Boolean(props["aria-label"] || props["aria-labelledby"]);
  useEffect(() => {
    if (isDev() && !named) console.warn(`${component} needs an accessible name: pass \`aria-label\` or \`aria-labelledby\`.`);
  }, [named, component]);
}
