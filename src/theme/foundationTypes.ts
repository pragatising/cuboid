import type {
  BorderRadiusTokens,
  BorderWidthTokens,
  BreakpointTokens,
  ContainerSizesTokens,
  GlobalColors,
  LayoutTokens,
  ShadowTokens,
  SpaceTokens,
  StackGapTokens,
  StackPaddingTokens,
  Typography,
  ZIndexTokens,
} from "./types";

/** Typography scales and text roles — not button label metrics. */
export type FoundationTypography = Omit<Typography, "button">;

/** Layout and spacing scales — not component geometry (control, pill, sheet, …). */
export interface FoundationSizes {
  space: SpaceTokens;
  stack: { gap: StackGapTokens; padding: StackPaddingTokens };
  layout: LayoutTokens;
  borderRadius: BorderRadiusTokens;
  borderWidth: BorderWidthTokens;
  breakpoints: BreakpointTokens;
  container: ContainerSizesTokens;
  zIndex: ZIndexTokens;
}

/**
 * Public token surface for app styling (styled-components, CSS-in-JS, etc.).
 * Component recipes (`colors.functional.*`, `sizes.control`, …) stay internal.
 */
export interface FoundationTokens {
  colors: { global: GlobalColors };
  typography: FoundationTypography;
  sizes: FoundationSizes;
  shadows: ShadowTokens;
}

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Dot-paths to scalar foundation token values (string or number). */
export type FoundationTokenPath = Leaves<FoundationTokens>;

type Leaves<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends string | number | boolean
    ? never
    : T extends object
      ? {
          [K in keyof T & string]: Leaves<T[K], Prev[D]> extends infer R
            ? R extends never
              ? K
              : `${K}.${R & string}`
            : never;
        }[keyof T & string]
      : never;
