import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type {
  ButtonVariantInteractiveColors,
  CubeTheme,
  PillIntensity,
  PillSurface,
  ThemeTokens,
} from "../../../theme/types";
import themeOutput from "../../../theme/output/theme.json";
import styles from "./Pill.module.css";

/** Shade keys from `pillColors` in theme.json — add `yellow.json`, etc. alongside `gray.json`. */
export type PillShade = keyof typeof themeOutput.pillColors;
export type { PillIntensity, PillSurface };

const PILL_STATES = ["rest", "hover", "pressed", "disabled"] as const;

function recipeToActiveVars(recipe: ButtonVariantInteractiveColors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of PILL_STATES) {
    out[`--cube-pill-active-bg-${s}`] = recipe.bgColor[s];
    out[`--cube-pill-active-fg-${s}`] = recipe.fgColor[s];
    out[`--cube-pill-active-border-${s}`] = recipe.borderColor[s];
  }
  return out;
}

function resolvePillRecipe(
  pill: ThemeTokens["colors"]["functional"]["pill"],
  shade: PillShade,
  intensity: PillIntensity,
  surface: PillSurface
): ButtonVariantInteractiveColors {
  const shadeBlock = pill[shade];
  const intensityBlock = shadeBlock?.[intensity];
  const recipe = intensityBlock?.[surface];
  if (!recipe) {
    throw new Error(
      `Missing pill recipe: colors.functional.pill.${shade}.${intensity}.${surface}`
    );
  }
  return recipe;
}

type PillElement = "span" | "a";

export interface PillProps {
  /** Color family — maps to Figma `shade` (token file per shade). */
  shade?: PillShade;
  /** Emphasis step — maps to Figma `intensity`. */
  intensity?: PillIntensity;
  /** When true, uses the `bordered` surface recipe (Figma `border?`). */
  border?: boolean;
  /** Render as static label (`span`) or link (`a` when `href` is set). */
  as?: PillElement;
  href?: string;
  size?: keyof ThemeTokens["sizes"]["pill"];
  leadingVisual?: React.ReactNode;
  trailingVisual?: React.ReactNode;
  theme?: CubeTheme;
  className?: string;
  children?: React.ReactNode;
}

export function Pill({
  shade = "gray",
  intensity = "light",
  border = false,
  as,
  href,
  size = "sm",
  leadingVisual,
  trailingVisual,
  theme,
  className,
  children,
  style,
  ...rest
}: PillProps & Omit<React.HTMLAttributes<HTMLElement>, "children">) {
  const tokens = useTheme(theme);
  const surface: PillSurface = border ? "bordered" : "filled";
  const Component: React.ElementType = as ?? (href ? "a" : "span");

  const recipe = resolvePillRecipe(tokens.colors.functional.pill, shade, intensity, surface);

  const classNames = [styles.Pill, styles[`Pill--size-${size}`], className]
    .filter(Boolean)
    .join(" ");

  const inlineVars = (() => {
    const pillType = tokens.typography.pill[size];
    const geom = tokens.sizes.pill[size];
    const base: Record<string, string> = {
      ...recipeToActiveVars(recipe),
      [`--cube-pill-${size}-paddingInline`]: geom.paddingInline,
      [`--cube-pill-${size}-paddingBlock`]: geom.paddingBlock,
      [`--cube-pill-${size}-borderRadius`]: geom.borderRadius,
      [`--cube-pill-${size}-gap`]: geom.gap,
    };
    if (theme) {
      Object.assign(base, {
        "--cube-sizes-borderWidth-thin": tokens.sizes.borderWidth.thin,
        "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
        [`--cube-typography-pill-${size}-fontSize`]: pillType.fontSize,
        [`--cube-typography-pill-${size}-fontWeight`]: String(pillType.fontWeight),
        [`--cube-typography-pill-${size}-lineHeight`]: pillType.lineHeight,
        "--cube-colors-functional-foreground-link": tokens.colors.functional.foreground.link,
      });
    }
    return base as React.CSSProperties;
  })();

  const anchorProps =
    Component === "a"
      ? { href, ...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>) }
      : rest;

  return (
    <Component
      className={classNames}
      style={{ ...(style ?? {}), ...inlineVars }}
      {...anchorProps}
    >
      {leadingVisual && <span className={styles.Pill__leadingVisual}>{leadingVisual}</span>}
      {children}
      {trailingVisual && <span className={styles.Pill__trailingVisual}>{trailingVisual}</span>}
    </Component>
  );
}
