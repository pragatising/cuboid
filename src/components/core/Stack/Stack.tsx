import React, { CSSProperties, forwardRef } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type {
  CubeTheme,
  LayoutWidth,
  StackGap,
  StackPadding,
  ThemeTokens,
} from "../../../theme/types";
import { stackScaleCubeOverride } from "../../../theme/themeCubeOverride";
import { isResponsiveObject, resolveResponsive, type Responsive } from "../../../utils/responsive";
import styles from "./Stack.module.css";

export type StackDirection = "horizontal" | "vertical";

export type { StackGap, StackPadding, LayoutWidth };
/** @deprecated Use `StackGap` or `StackPadding`. */
export type { StackGap as StackSpacing };

export interface StackProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color"> {
  as?: React.ElementType;
  direction?: Responsive<StackDirection>;
  gap?: Responsive<StackGap>;
  padding?: Responsive<StackPadding>;
  paddingBlock?: Responsive<StackPadding>;
  paddingInline?: Responsive<StackPadding>;
  align?: Responsive<CSSProperties["alignItems"]>;
  justify?: Responsive<CSSProperties["justifyContent"]>;
  wrap?: Responsive<boolean>;
  grow?: boolean | number;
  shrink?: boolean | number;
  width?: LayoutWidth;
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
  gap: ThemeTokens["sizes"]["stack"]["gap"] | undefined,
): string | undefined {
  if (key === undefined) return undefined;
  return gap?.[key];
}

function paddingToCss(
  key: StackPadding | undefined,
  padding: ThemeTokens["sizes"]["stack"]["padding"] | undefined,
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
  layout: ThemeTokens["sizes"]["layout"],
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

function stackLayoutStyle(
  props: Pick<StackProps, "grow" | "shrink" | "width" | "minWidth">,
  layout: ThemeTokens["sizes"]["layout"],
): CSSProperties {
  const style: CSSProperties = {};

  if (typeof props.grow === "number") {
    style.flexGrow = props.grow;
  }

  if (props.shrink === true) {
    style.flexShrink = 1;
  } else if (typeof props.shrink === "number") {
    style.flexShrink = props.shrink;
  }

  const widthKey = props.width;
  if (widthKey === "page" || widthKey === "content" || widthKey === "label") {
    const widthVal = layoutWidthToCss(widthKey, layout);
    if (widthVal !== undefined) {
      style.width = widthVal;
    }
  }

  return style;
}

function stackResponsiveCssVars(
  sizes: ThemeTokens["sizes"],
  props: Pick<
    StackProps,
    "direction" | "gap" | "padding" | "paddingBlock" | "paddingInline" | "align" | "justify" | "wrap"
  >,
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

function stackUsesResponsiveLayout(props: Pick<
  StackProps,
  "direction" | "gap" | "padding" | "paddingBlock" | "paddingInline" | "align" | "justify" | "wrap"
>): boolean {
  return (
    isResponsiveObject(props.direction) ||
    isResponsiveObject(props.gap) ||
    isResponsiveObject(props.padding) ||
    isResponsiveObject(props.paddingBlock) ||
    isResponsiveObject(props.paddingInline) ||
    isResponsiveObject(props.align) ||
    isResponsiveObject(props.justify) ||
    isResponsiveObject(props.wrap)
  );
}

function alignModifierClass(align: CSSProperties["alignItems"]): string | undefined {
  switch (align) {
    case "stretch":
      return styles["Stack--align-stretch"];
    case "center":
      return styles["Stack--align-center"];
    case "flex-start":
    case "start":
      return styles["Stack--align-start"];
    case "flex-end":
    case "end":
      return styles["Stack--align-end"];
    case "baseline":
      return styles["Stack--align-baseline"];
    default:
      return undefined;
  }
}

function justifyModifierClass(
  justify: CSSProperties["justifyContent"],
): string | undefined {
  switch (justify) {
    case "flex-start":
    case "start":
      return styles["Stack--justify-start"];
    case "center":
      return styles["Stack--justify-center"];
    case "flex-end":
    case "end":
      return styles["Stack--justify-end"];
    case "space-between":
      return styles["Stack--justify-between"];
    case "space-around":
      return styles["Stack--justify-around"];
    case "space-evenly":
      return styles["Stack--justify-evenly"];
    default:
      return undefined;
  }
}

function stackModifierClasses(
  props: Pick<
    StackProps,
    | "direction"
    | "gap"
    | "padding"
    | "paddingBlock"
    | "paddingInline"
    | "align"
    | "justify"
    | "wrap"
    | "grow"
    | "shrink"
    | "minWidth"
    | "width"
  >,
): string[] {
  const classes = [styles.Stack];

  if (stackUsesResponsiveLayout(props)) {
    classes.push(styles["Stack--responsive"]);
    return classes;
  }

  const direction = props.direction ?? "vertical";
  if (direction === "horizontal") {
    classes.push(styles["Stack--direction-horizontal"]);
  }

  if (props.gap !== undefined) {
    classes.push(styles[`Stack--gap-${props.gap}` as keyof typeof styles]);
  }

  if (props.paddingBlock !== undefined) {
    classes.push(
      styles[`Stack--paddingBlock-${props.paddingBlock}` as keyof typeof styles],
    );
  } else if (props.padding !== undefined) {
    classes.push(styles[`Stack--padding-${props.padding}` as keyof typeof styles]);
  }

  if (props.paddingInline !== undefined) {
    classes.push(
      styles[`Stack--paddingInline-${props.paddingInline}` as keyof typeof styles],
    );
  }

  if (props.align !== undefined && typeof props.align === "string") {
    const alignClass = alignModifierClass(props.align);
    if (alignClass) classes.push(alignClass);
  }

  if (props.justify !== undefined && typeof props.justify === "string") {
    const justifyClass = justifyModifierClass(props.justify);
    if (justifyClass) classes.push(justifyClass);
  }

  const wrap = props.wrap ?? false;
  classes.push(wrap ? styles["Stack--wrap-wrap"] : styles["Stack--wrap-nowrap"]);

  if (props.grow === true) {
    classes.push(styles["Stack--grow"]);
  } else if (props.grow === false) {
    classes.push(styles["Stack--grow-0"]);
  }

  if (props.shrink === false) {
    classes.push(styles["Stack--shrink-0"]);
  }

  if (props.minWidth === 0) {
    classes.push(styles["Stack--minWidth-0"]);
  }

  if (props.width === "full") {
    classes.push(styles["Stack--width-full"]);
  } else if (props.width === "auto") {
    classes.push(styles["Stack--width-auto"]);
  }

  return classes;
}

/**
 * Flex-based layout primitive. Scalar layout props map to CSS module modifiers
 * that read global `--cube-stack-*` tokens (same pattern as {@link Button}).
 *
 * Responsive object props (`{ sm, md, lg }`) still set per-tier `--stack-*` vars
 * on the element. Local `theme` overrides re-bind `--cube-stack-*` scale tokens.
 */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(
  {
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
    ...rest
  },
  ref,
) {
  const tokens = useTheme(theme);

  const layoutProps = {
    direction,
    gap,
    padding,
    paddingBlock,
    paddingInline,
    align,
    justify,
    wrap,
    grow,
    shrink,
    minWidth,
    width,
  };

  const classNames = [
    ...stackModifierClasses(layoutProps),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const responsiveVars = stackUsesResponsiveLayout(layoutProps)
    ? stackResponsiveCssVars(tokens.sizes, layoutProps)
    : undefined;

  const themeOverride = theme
    ? stackScaleCubeOverride(tokens)
    : undefined;

  const layoutStyle = stackLayoutStyle(layoutProps, tokens.sizes.layout);

  return (
    <As
      ref={ref}
      className={classNames}
      style={{
        ...responsiveVars,
        ...themeOverride,
        ...layoutStyle,
        ...style,
      }}
      {...rest}
    >
      {children}
    </As>
  );
});
