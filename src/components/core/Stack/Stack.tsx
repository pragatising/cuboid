import React, { CSSProperties } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, StackGap, StackPadding, ThemeTokens } from "../../../theme/types";
import { resolveResponsive, type Responsive } from "../../../utils/responsive";
import styles from "./Stack.module.css";

export type StackDirection = "horizontal" | "vertical";

export type { StackGap, StackPadding };
/** @deprecated Use `StackGap` or `StackPadding`. */
export type { StackGap as StackSpacing };

export interface StackProps {
  /** HTML element or component to render as (default: div) */
  as?: React.ElementType;
  /** Flex direction — scalar or `{ sm, md, lg }` for responsive layout */
  direction?: Responsive<StackDirection>;
  /** Gap between children — `none`, `xxs` … `xxl`; responsive supported */
  gap?: Responsive<StackGap>;
  /** Padding on all sides — same scale as gap; overridden by `paddingBlock` / `paddingInline` */
  padding?: Responsive<StackPadding>;
  /** Block-axis padding (overrides `padding` on block axis) */
  paddingBlock?: Responsive<StackPadding>;
  /** Inline-axis padding (overrides `padding` on inline axis) */
  paddingInline?: Responsive<StackPadding>;
  /** align-items — responsive supported */
  align?: Responsive<CSSProperties["alignItems"]>;
  /** justify-content — responsive supported */
  justify?: Responsive<CSSProperties["justifyContent"]>;
  /** Allow children to wrap — responsive supported */
  wrap?: Responsive<boolean>;
  theme?: CubeTheme;
  style?: CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

function directionToFlex(direction: StackDirection | undefined): CSSProperties["flexDirection"] {
  if (direction === "horizontal") return "row";
  if (direction === "vertical") return "column";
  return undefined;
}

function gapToCss(
  key: StackGap | undefined,
  gap: ThemeTokens["sizes"]["stack"]["gap"] | undefined
): string | undefined {
  if (key === undefined) return undefined;
  return gap?.[key];
}

function paddingToCss(
  key: StackPadding | undefined,
  padding: ThemeTokens["sizes"]["stack"]["padding"] | undefined
): string | undefined {
  if (key === undefined) return undefined;
  return padding?.[key];
}

function wrapToCss(wrap: boolean | undefined): CSSProperties["flexWrap"] {
  if (wrap === undefined) return undefined;
  return wrap ? "wrap" : "nowrap";
}

function stackCssVars(
  sizes: ThemeTokens["sizes"],
  props: Pick<
    StackProps,
    "direction" | "gap" | "padding" | "paddingBlock" | "paddingInline" | "align" | "justify" | "wrap"
  >
): Record<string, string> {
  const out: Record<string, string> = {};
  const { stack } = sizes;

  const direction = resolveResponsive(props.direction);
  const gap = resolveResponsive(props.gap);
  const padding = resolveResponsive(props.padding);
  const paddingBlock = resolveResponsive(props.paddingBlock);
  const paddingInline = resolveResponsive(props.paddingInline);
  const align = resolveResponsive(props.align);
  const justify = resolveResponsive(props.justify);
  const wrap = resolveResponsive(props.wrap);

  for (const tier of ["sm", "md", "lg"] as const) {
    const dir = directionToFlex(direction[tier]);
    if (dir) out[`--stack-direction-${tier}`] = dir;

    const gapVal = gapToCss(gap[tier], stack.gap);
    if (gapVal !== undefined) out[`--stack-gap-${tier}`] = gapVal;

    const padFallback = padding[tier];
    const padBlockVal = paddingToCss(paddingBlock[tier] ?? padFallback, stack.padding);
    if (padBlockVal !== undefined) out[`--stack-padding-block-${tier}`] = padBlockVal;

    const padInlineVal = paddingToCss(paddingInline[tier] ?? padFallback, stack.padding);
    if (padInlineVal !== undefined) out[`--stack-padding-inline-${tier}`] = padInlineVal;

    if (align[tier] !== undefined) out[`--stack-align-${tier}`] = String(align[tier]);

    if (justify[tier] !== undefined) out[`--stack-justify-${tier}`] = String(justify[tier]);

    const wrapVal = wrapToCss(wrap[tier]);
    if (wrapVal !== undefined) out[`--stack-wrap-${tier}`] = wrapVal;
  }

  return out;
}

/**
 * Flex-based layout primitive. Replaces raw <div> usage for arranging
 * children horizontally or vertically with consistent spacing.
 *
 * `gap` uses `none`, `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl`.
 * `padding`, `paddingBlock`, and `paddingInline` use the same stop names.
 * Directional padding props override the matching axis from `padding`.
 *
 * Responsive: pass `{ sm, md, lg }` on layout props (mobile-first).
 * `sm` = default; `md` / `lg` override at `--cube-breakpoint-md` / `--cube-breakpoint-lg`.
 */
export function Stack({
  as: As = "div",
  direction = "vertical",
  gap,
  padding,
  paddingBlock,
  paddingInline,
  align,
  justify,
  wrap = false,
  theme,
  style,
  className,
  children,
}: StackProps) {
  const tokens = useTheme(theme);

  const classNames = [styles.Stack, className].filter(Boolean).join(" ");

  return (
    <As
      className={classNames}
      style={{
        ...stackCssVars(tokens.sizes, {
          direction,
          gap,
          padding,
          paddingBlock,
          paddingInline,
          align,
          justify,
          wrap,
        }),
        ...style,
      }}
    >
      {children}
    </As>
  );
}
