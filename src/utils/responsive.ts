/** Mobile-first breakpoints — `sm` is the default (no min-width). */
export type Breakpoint = "sm" | "md" | "lg";

export const BREAKPOINTS: Breakpoint[] = ["sm", "md", "lg"];

/** Scalar applies to all breakpoints; object sets per-tier values with cascade (md ← sm, lg ← md ← sm). */
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>;

export function isResponsiveObject<T>(
  value: Responsive<T>
): value is Partial<Record<Breakpoint, T>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Resolve mobile-first values for each tier. */
export function resolveResponsive<T>(
  value: Responsive<T> | undefined
): Record<Breakpoint, T | undefined> {
  if (value === undefined) {
    return { sm: undefined, md: undefined, lg: undefined };
  }
  if (!isResponsiveObject(value)) {
    const scalar = value as T;
    return { sm: scalar, md: scalar, lg: scalar };
  }
  const sm = value.sm;
  const md = value.md ?? value.sm;
  const lg = value.lg ?? value.md ?? value.sm;
  return { sm, md, lg };
}
