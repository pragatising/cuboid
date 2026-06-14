import type { GlobalColors } from "./types";

/**
 * Dot-path into `ThemeTokens.colors.global` (from `tokens/functional/colors/globals.json`).
 *
 * App-facing color props use global tokens — not `colors.functional.*` component recipes.
 * Component-only tokens (button, pill, highlight, sheet, …) stay internal to those components.
 *
 * @example "canvas.inset" | "text.muted" | "bg.gray.light.02" | "fg.blue.3" | "primary"
 */
export type GlobalColorPath = string;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Resolve a global dot-path to a CSS color, or `undefined` when not found. */
export function resolveGlobalColor(
  path: GlobalColorPath,
  global: GlobalColors
): string | undefined {
  const parts = path.split(".");
  let cur: unknown = global;

  for (const part of parts) {
    if (!isPlainObject(cur)) return undefined;
    cur = cur[part];
  }

  return typeof cur === "string" ? cur : undefined;
}

/**
 * Resolve a global path, with optional per-component legacy aliases, or treat as raw CSS.
 */
export function resolveGlobalColorOrCss(
  path: GlobalColorPath,
  global: GlobalColors,
  aliases?: Record<string, GlobalColorPath>
): string {
  const normalized = aliases?.[path] ?? path;
  return resolveGlobalColor(normalized, global) ?? normalized;
}

/** Common global paths for docs / Storybook controls (not exhaustive). */
export const GLOBAL_COLOR_PATH_EXAMPLES = {
  canvas: ["canvas.default", "canvas.inset", "canvas.subtle", "canvas.insetStrong"],
  text: ["text.default", "text.muted", "text.subtle", "text.contrast"],
  bg: ["bg.gray.light.01", "bg.gray.light.02", "bg.gray.dark.07"],
  border: ["border.gray.1", "border.gray.2", "border.grayAlpha.2"],
  fg: ["fg.neutral.5", "fg.blue.3", "fg.green.2"],
  semantic: [
    "primary",
    "success.default",
    "warning.default",
    "error.default",
    "info.default",
  ],
} as const;
