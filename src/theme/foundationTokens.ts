import { defaultTheme } from "./defaultTheme";
import type { FoundationTokenPath, FoundationTokens } from "./foundationTypes";

const {
  space,
  spaceScale,
  stack,
  layout,
  borderRadius,
  borderWidth,
  breakpoints,
  container,
  zIndex,
} = defaultTheme.sizes;

const { button: _buttonTypography, ...typography } = defaultTheme.typography;

/** Resolved foundation tokens — safe for free-form app styling. */
export const foundationTokens: FoundationTokens = {
  colors: { global: defaultTheme.colors.global },
  typography,
  sizes: {
    space,
    spaceScale,
    stack,
    layout,
    borderRadius,
    borderWidth,
    breakpoints,
    container,
    zIndex,
  },
  shadows: defaultTheme.shadows,
};

/** @deprecated Prefer `foundationTokens` — kept as a short alias. */
export const tokens = foundationTokens;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getByPath(root: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = root;

  for (const part of parts) {
    if (!isPlainObject(cur)) return undefined;
    cur = cur[part];
  }

  return cur;
}

/** Resolve a typed foundation dot-path to its scalar value. */
export function token(path: FoundationTokenPath): string | number {
  const value = getByPath(foundationTokens, path);

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  throw new Error(
    `Foundation token "${path}" is not a scalar (got ${typeof value}). Use a path to a string or number leaf.`
  );
}
