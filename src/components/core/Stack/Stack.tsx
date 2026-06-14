import React, { CSSProperties } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type {
  CubeTheme,
  LayoutWidth,
  StackGap,
  StackPadding,
  ThemeTokens,
} from "../../../theme/types";
import { resolveResponsive, type Responsive } from "../../../utils/responsive";
import styles from "./Stack.module.css";

export type StackDirection = "horizontal" | "vertical";

export type { StackGap, StackPadding, LayoutWidth };
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
  /** Flex grow — `true` sets `flex: 1 1 0%` for fill-remaining-space columns */
  grow?: boolean | number;
  /** Flex shrink — `false` prevents a column from shrinking below its width */
  shrink?: boolean | number;
  /** Token-based width — `label` for section labels, `page` / `content` for max-width columns */
  width?: LayoutWidth;
  /** `0` enables text truncation inside horizontal flex rows */
  minWidth?: 0;
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

function layoutWidthToCss(
  key: LayoutWidth | undefined,
  layout: ThemeTokens["sizes"]["layout"]
): string | undefined {
  if (key === undefined) return undefined;
  switch (key) {
    case "label":
      return layout.sectionLabelWidth;
    case "page":
      return layout.pageMaxWidth;
    case "content":
      return layout.contentMaxWidth;
    case "full":
      return "100%";
    case "auto":
      return "auto";
    default:
      return undefined;
  }
}

function stackFlexStyle(
  props: Pick<StackProps, "grow" | "shrink" | "width" | "minWidth">,
  layout: ThemeTokens["sizes"]["layout"]
): CSSProperties {
  const style: CSSProperties = {};

  if (props.grow === true) {
    style.flex = "1 1 0%";
  } else if (props.grow === false) {
    style.flexGrow = 0;
  } else if (typeof props.grow === "number") {
    style.flexGrow = props.grow;
  }

  if (props.shrink === false) {
    style.flexShrink = 0;
  } else if (props.shrink === true) {
    style.flexShrink = 1;
  } else if (typeof props.shrink === "number") {
    style.flexShrink = props.shrink;
  }

  const widthVal = layoutWidthToCss(props.width, layout);
  if (widthVal !== undefined) {
    style.width = widthVal;
  }

  if (props.minWidth === 0) {
    style.minWidth = 0;
  }

  return style;
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
 * Flex child sizing: `grow`, `shrink`, `width`, and `minWidth={0}` compose
 * section rows and side-by-side columns without custom CSS.
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
  grow,
  shrink,
  width,
  minWidth,
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
        ...stackFlexStyle({ grow, shrink, width, minWidth }, tokens.sizes.layout),
        ...style,
      }}
    >
      {children}
    </As>
  );
}
